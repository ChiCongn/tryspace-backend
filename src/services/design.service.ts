import { randomUUID } from "crypto";
import type { UploadApiResponse } from "cloudinary";
import { Prisma } from "@prisma/client";

import { cloudinary } from "../lib/cloudinary";
import { prisma } from "../lib/prisma";
import { listDesignsQuerySchema, type CreateDesignInput, type DesignItemInput, type UpdateDesignInput } from "../schemas/design.schema";
import * as cartService from "../services/cart.service";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";

const DESIGN_DEFAULT_LIMIT = 12;
const SHARE_URL_BASE = "https://tryspace.app/design";

const designInclude = {
  user: {
    select: {
      displayName: true,
      avatarUrl: true
    }
  },
  items: {
    orderBy: { sortOrder: "asc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          thumbnailUrl: true,
          basePrice: true,
          isActive: true,
          variants: {
            where: { isDefault: true },
            take: 1,
            select: {
              id: true,
              name: true,
              hexColor: true,
              priceAddon: true
            }
          }
        }
      },
      variant: {
        select: {
          id: true,
          name: true,
          hexColor: true,
          priceAddon: true
        }
      }
    }
  }
} satisfies Prisma.DesignInclude;

type DesignWithRelations = Prisma.DesignGetPayload<{ include: typeof designInclude }>;

function designLimit(rawLimit: number | undefined): number {
  return Math.min(Math.max(rawLimit ?? DESIGN_DEFAULT_LIMIT, 1), 100);
}

function shareUrl(shareToken: string): string {
  return `${SHARE_URL_BASE}/${shareToken}`;
}

function itemUnitPrice(item: DesignWithRelations["items"][number]): number {
  const variant = item.variant ?? item.product.variants[0] ?? null;
  return item.product.basePrice + (variant?.priceAddon ?? 0);
}

function formatDesignItem(item: DesignWithRelations["items"][number]) {
  const effectiveVariant = item.variant ?? item.product.variants[0] ?? null;

  return {
    id: item.id,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      thumbnailUrl: item.product.thumbnailUrl,
      basePrice: item.product.basePrice,
      isActive: item.product.isActive
    },
    variant: effectiveVariant
      ? {
          id: effectiveVariant.id,
          name: effectiveVariant.name,
          hexColor: effectiveVariant.hexColor
        }
      : null,
    transform: item.transform,
    sortOrder: item.sortOrder,
    unitPrice: itemUnitPrice(item)
  };
}

function formatDesignDetail(design: DesignWithRelations, includeOwner = false) {
  const items = design.items.map(formatDesignItem);

  return {
    id: design.id,
    name: design.name,
    thumbnailUrl: design.thumbnailUrl,
    shareToken: design.shareToken,
    shareUrl: shareUrl(design.shareToken),
    clonedFrom: design.clonedFrom,
    ...(includeOwner ? { owner: design.user } : {}),
    items,
    itemCount: items.length,
    totalValue: items.reduce((sum, item) => sum + item.unitPrice, 0),
    createdAt: design.createdAt,
    updatedAt: design.updatedAt
  };
}

function formatDesignSummary(design: DesignWithRelations) {
  const detail = formatDesignDetail(design);

  return {
    id: detail.id,
    name: detail.name,
    thumbnailUrl: detail.thumbnailUrl,
    shareToken: detail.shareToken,
    shareUrl: detail.shareUrl,
    itemCount: detail.itemCount,
    totalValue: detail.totalValue,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt
  };
}

async function uploadThumbnail(thumbnail: string | undefined): Promise<string | null> {
  if (!thumbnail) {
    return null;
  }

  try {
    const base64 = thumbnail.split(";base64,")[1];
    if (!base64) {
      return null;
    }

    const buffer = Buffer.from(base64, "base64");

    return await new Promise<string | null>((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "tryspace/designs",
          resource_type: "image",
          transformation: [{ width: 800, crop: "limit" }]
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result?.secure_url) {
            resolve(null);
            return;
          }

          resolve(result.secure_url);
        }
      );

      stream.end(buffer);
    });
  } catch {
    return null;
  }
}

async function validateDesignItems(items: DesignItemInput[]): Promise<void> {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true
    },
    select: { id: true }
  });
  const activeProductIds = new Set(products.map((product) => product.id));

  for (const item of items) {
    if (!activeProductIds.has(item.productId)) {
      throw new ApiError(400, "INVALID_PRODUCT", "productId không tồn tại hoặc inactive", {
        productId: item.productId
      });
    }

    if (!item.variantId) {
      continue;
    }

    const variant = await prisma.productVariant.findFirst({
      where: {
        id: item.variantId,
        productId: item.productId
      },
      select: { id: true }
    });

    if (!variant) {
      throw new ApiError(400, "INVALID_VARIANT", "variantId không thuộc product này", {
        productId: item.productId,
        variantId: item.variantId
      });
    }
  }
}

function designItemCreateData(items: DesignItemInput[]) {
  return items.map((item, index) => ({
    productId: item.productId,
    variantId: item.variantId ?? null,
    transform: item.transform as Prisma.InputJsonValue,
    sortOrder: index
  }));
}

async function findOwnedDesign(designId: string, userId: string, role?: string) {
  const design = await prisma.design.findUnique({
    where: { id: designId },
    include: designInclude
  });

  if (!design) {
    throw new ApiError(404, "DESIGN_NOT_FOUND", "Design không tồn tại");
  }

  if (role !== "ADMIN" && design.userId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Không có quyền truy cập design này");
  }

  return design;
}

export async function listDesigns(userId: string, rawQuery: unknown) {
  const query = listDesignsQuerySchema.parse(rawQuery ?? {});
  const page = query.page ?? 1;
  const limit = designLimit(query.limit);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ?? "createdAt";

  const [total, designs] = await Promise.all([
    prisma.design.count({ where: { userId } }),
    prisma.design.findMany({
      where: { userId },
      include: designInclude,
      orderBy: { [sortBy]: sortBy === "name" ? "asc" : "desc" },
      skip,
      take: limit
    })
  ]);

  return {
    data: designs.map(formatDesignSummary),
    meta: buildPaginationMeta(total, page, limit)
  };
}

export async function createDesign(userId: string, input: CreateDesignInput) {
  const designCount = await prisma.design.count({ where: { userId } });

  if (designCount >= 50) {
    throw new ApiError(400, "DESIGN_LIMIT_EXCEEDED", "Đã đạt giới hạn 50 designs");
  }

  await validateDesignItems(input.items);
  const thumbnailUrl = await uploadThumbnail(input.thumbnail);

  const design = await prisma.design.create({
    data: {
      userId,
      name: input.name,
      thumbnailUrl,
      shareToken: randomUUID(),
      items: {
        create: designItemCreateData(input.items)
      }
    },
    include: designInclude
  });

  return formatDesignDetail(design);
}

export async function getDesign(designId: string, userId: string, role?: string) {
  return formatDesignDetail(await findOwnedDesign(designId, userId, role));
}

export async function getSharedDesign(shareToken: string) {
  const design = await prisma.design.findUnique({
    where: { shareToken },
    include: designInclude
  });

  if (!design) {
    throw new ApiError(404, "DESIGN_NOT_FOUND", "Design không tồn tại");
  }

  return formatDesignDetail(design, true);
}

export async function updateDesign(designId: string, userId: string, role: string | undefined, input: UpdateDesignInput) {
  await findOwnedDesign(designId, userId, role);

  if (input.items !== undefined) {
    await validateDesignItems(input.items);
  }

  const thumbnailUrl = await uploadThumbnail(input.thumbnail);
  const design = await prisma.$transaction(async (tx) => {
    if (input.items !== undefined) {
      await tx.designItem.deleteMany({ where: { designId } });
      if (input.items.length > 0) {
        await tx.designItem.createMany({
          data: designItemCreateData(input.items).map((item) => ({
            ...item,
            designId
          }))
        });
      }
    }

    return tx.design.update({
      where: { id: designId },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.thumbnail === undefined ? {} : { thumbnailUrl })
      },
      include: designInclude
    });
  });

  return formatDesignDetail(design);
}

export async function deleteDesign(designId: string, userId: string, role?: string): Promise<void> {
  await findOwnedDesign(designId, userId, role);
  await prisma.design.delete({ where: { id: designId } });
}

export async function cloneSharedDesign(shareToken: string, userId: string) {
  const sourceDesign = await prisma.design.findUnique({
    where: { shareToken },
    include: { items: true }
  });

  if (!sourceDesign) {
    throw new ApiError(404, "DESIGN_NOT_FOUND", "Design không tồn tại");
  }

  const design = await prisma.design.create({
    data: {
      userId,
      name: `${sourceDesign.name} (copy)`,
      thumbnailUrl: sourceDesign.thumbnailUrl,
      shareToken: randomUUID(),
      clonedFrom: sourceDesign.shareToken,
      items: {
        create: sourceDesign.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          transform: item.transform as Prisma.InputJsonValue,
          sortOrder: item.sortOrder
        }))
      }
    },
    include: designInclude
  });

  return formatDesignDetail(design);
}

export async function addAllToCart(designId: string, userId: string, role?: string) {
  const design = await findOwnedDesign(designId, userId, role);
  const skippedItems: Array<{ productId: string; name: string; reason: string }> = [];
  let added = 0;

  for (const item of design.items) {
    if (!item.product.isActive) {
      skippedItems.push({
        productId: item.product.id,
        name: item.product.name,
        reason: "PRODUCT_INACTIVE"
      });
      continue;
    }

    try {
      await cartService.addItem(userId, {
        productId: item.product.id,
        variantId: item.variantId,
        quantity: 1
      });
      added += 1;
    } catch (error) {
      if (error instanceof ApiError) {
        skippedItems.push({
          productId: item.product.id,
          name: item.product.name,
          reason: error.code
        });
        continue;
      }

      throw error;
    }
  }

  return {
    added,
    skipped: skippedItems.length,
    skippedItems,
    cart: await cartService.getCart(userId)
  };
}
