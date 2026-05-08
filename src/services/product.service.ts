import { Prisma, Role } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { productListQuerySchema, type CreateProductInput, type UpdateProductInput, type UpdateVariantInput } from "../schemas/product.schema";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";
import { slugify } from "../utils/slugify";

const PRODUCT_LIST_DEFAULT_LIMIT = 12;
const PRODUCT_LIST_MAX_LIMIT = 48;

const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  variants: {
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      hexColor: true,
      textureUrl: true,
      priceAddon: true,
      isDefault: true,
      stockQuantity: true
    }
  },
  images: {
    orderBy: [{ displayOrder: "asc" }],
    select: {
      id: true,
      url: true,
      alt: true,
      displayOrder: true
    }
  }
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function productListLimit(rawLimit: number | undefined): number {
  return Math.min(Math.max(rawLimit ?? PRODUCT_LIST_DEFAULT_LIMIT, 1), PRODUCT_LIST_MAX_LIMIT);
}

function isCuid(value: string): boolean {
  return /^c[a-z0-9]{24}$/i.test(value);
}

function isInStock(stockQuantity: number | null): boolean {
  return stockQuantity === null || stockQuantity > 0;
}

function formatVariant(variant: ProductWithRelations["variants"][number], basePrice: number) {
  return {
    ...variant,
    finalPrice: basePrice + variant.priceAddon
  };
}

function formatProductSummary(product: ProductWithRelations) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    thumbnailUrl: product.thumbnailUrl,
    basePrice: product.basePrice,
    comparePrice: product.comparePrice,
    finalPrice: product.basePrice,
    hasArSupport: product.hasArSupport,
    averageRating: product.averageRating,
    totalReviews: product.totalReviews,
    inStock: isInStock(product.stockQuantity),
    tags: product.tags,
    variants: product.variants.map((variant) => formatVariant(variant, product.basePrice)),
    dimensions: product.dimensions
  };
}

function formatProductDetail(product: ProductWithRelations, ratingDistribution: Record<string, number>) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    images: product.images,
    thumbnailUrl: product.thumbnailUrl,
    modelUrl: product.modelUrl,
    hasArSupport: product.hasArSupport,
    basePrice: product.basePrice,
    comparePrice: product.comparePrice,
    finalPrice: product.basePrice,
    variants: product.variants.map((variant) => formatVariant(variant, product.basePrice)),
    dimensions: product.dimensions,
    materials: product.materials,
    tags: product.tags,
    averageRating: product.averageRating,
    totalReviews: product.totalReviews,
    ratingDistribution,
    inStock: isInStock(product.stockQuantity),
    stockQuantity: product.stockQuantity,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(name) || "product";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {})
      },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function ensureCategoryExists(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true }
  });

  if (!category) {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Danh mục không tồn tại");
  }
}

function buildListWhere(input: ReturnType<typeof productListQuerySchema.parse>): Prisma.Sql {
  const conditions: Prisma.Sql[] = [Prisma.sql`p."isActive" = true`];

  if (input.search) {
    conditions.push(Prisma.sql`to_tsvector('simple', p."name" || ' ' || p."description" || ' ' || array_to_string(p."tags", ' '))
      @@ plainto_tsquery('simple', ${input.search})`);
  }

  if (input.categoryId) {
    conditions.push(Prisma.sql`p."categoryId" = ${input.categoryId}`);
  }

  if (input.categorySlug) {
    conditions.push(Prisma.sql`c."slug" = ${input.categorySlug}`);
  }

  if (input.minPrice !== undefined) {
    conditions.push(Prisma.sql`p."basePrice" >= ${input.minPrice}`);
  }

  if (input.maxPrice !== undefined) {
    conditions.push(Prisma.sql`p."basePrice" <= ${input.maxPrice}`);
  }

  if (input.color) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ProductVariant" pv
      WHERE pv."productId" = p."id" AND pv."hexColor" ILIKE ${`%${input.color}%`}
    )`);
  }

  if (input.material) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ProductVariant" pv
      WHERE pv."productId" = p."id" AND pv."name" ILIKE ${`%${input.material}%`}
    )`);
  }

  if (input.hasArSupport !== undefined) {
    conditions.push(Prisma.sql`p."hasArSupport" = ${input.hasArSupport}`);
  }

  if (input.inStock !== undefined) {
    conditions.push(
      input.inStock
        ? Prisma.sql`(p."stockQuantity" IS NULL OR p."stockQuantity" > 0)`
        : Prisma.sql`p."stockQuantity" = 0`
    );
  }

  if (input.tags) {
    const tags = input.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (tags.length > 0) {
      conditions.push(Prisma.sql`p."tags" && ARRAY[${Prisma.join(tags)}]::text[]`);
    }
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}

function orderBySql(sortBy: string | undefined): Prisma.Sql {
  switch (sortBy) {
    case "price":
      return Prisma.sql`p."basePrice"`;
    case "rating":
      return Prisma.sql`p."averageRating"`;
    case "popular":
      return Prisma.sql`p."totalReviews"`;
    case "createdAt":
    default:
      return Prisma.sql`p."createdAt"`;
  }
}

function orderDirectionSql(sortOrder: string | undefined): Prisma.Sql {
  return sortOrder === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
}

export async function listProducts(rawQuery: unknown) {
  const query = productListQuerySchema.parse(rawQuery ?? {});
  const page = query.page ?? 1;
  const limit = productListLimit(query.limit);
  const skip = (page - 1) * limit;
  const whereSql = buildListWhere(query);
  const sortSql = orderBySql(query.sortBy);
  const directionSql = orderDirectionSql(query.sortOrder);

  const [countRows, idRows] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "Product" p
      INNER JOIN "Category" c ON c."id" = p."categoryId"
      ${whereSql}
    `),
    prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT p."id"
      FROM "Product" p
      INNER JOIN "Category" c ON c."id" = p."categoryId"
      ${whereSql}
      ORDER BY ${sortSql} ${directionSql}, p."id" ASC
      LIMIT ${limit}
      OFFSET ${skip}
    `)
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const ids = idRows.map((row) => row.id);

  if (ids.length === 0) {
    return {
      data: [],
      meta: buildPaginationMeta(total, page, limit)
    };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: productInclude
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  return {
    data: ids.map((id) => productMap.get(id)).filter((product): product is ProductWithRelations => Boolean(product)).map(formatProductSummary),
    meta: buildPaginationMeta(total, page, limit)
  };
}

async function buildRatingDistribution(productId: string): Promise<Record<string, number>> {
  const groupedRatings = await prisma.review.groupBy({
    by: ["rating"],
    where: {
      productId,
      status: "APPROVED"
    },
    _count: { _all: true }
  });
  const distribution: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };

  for (const row of groupedRatings) {
    distribution[String(row.rating)] = row._count._all;
  }

  return distribution;
}

export async function getProduct(idOrSlug: string, viewerRole?: Role) {
  const isAdmin = viewerRole === "ADMIN";
  const product = await prisma.product.findFirst({
    where: {
      ...(isCuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug }),
      ...(isAdmin ? {} : { isActive: true })
    },
    include: productInclude
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại");
  }

  return formatProductDetail(product, await buildRatingDistribution(product.id));
}

export async function getRelatedProducts(productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true
    },
    select: {
      id: true,
      categoryId: true
    }
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại");
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      id: { not: product.id }
    },
    orderBy: [{ averageRating: "desc" }, { totalReviews: "desc" }, { createdAt: "desc" }],
    take: 8,
    include: productInclude
  });

  return related.map(formatProductSummary);
}

function imageCreateData(images: CreateProductInput["images"]) {
  return (images ?? []).map((image, index) => ({
    url: image.url,
    alt: image.alt,
    displayOrder: image.displayOrder ?? index + 1
  }));
}

function variantCreateData(variants: CreateProductInput["variants"]) {
  return (variants ?? []).map((variant) => ({
    name: variant.name,
    type: variant.type,
    hexColor: variant.hexColor,
    textureUrl: variant.textureUrl,
    priceAddon: variant.priceAddon ?? 0,
    isDefault: variant.isDefault ?? false,
    stockQuantity: variant.stockQuantity
  }));
}

export async function createProduct(input: CreateProductInput) {
  await ensureCategoryExists(input.categoryId);

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug: await generateUniqueSlug(input.name),
      description: input.description,
      category: { connect: { id: input.categoryId } },
      basePrice: input.basePrice,
      comparePrice: input.comparePrice,
      thumbnailUrl: input.thumbnailUrl,
      modelUrl: input.modelUrl,
      hasArSupport: input.hasArSupport ?? false,
      dimensions: input.dimensions as Prisma.InputJsonValue,
      materials: input.materials ?? [],
      tags: input.tags ?? [],
      stockQuantity: input.stockQuantity,
      images: {
        create: imageCreateData(input.images)
      },
      variants: {
        create: variantCreateData(input.variants)
      }
    },
    include: productInclude
  });

  return formatProductDetail(product, { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 });
}

async function assertVariantDeleteAllowed(variantIds: string[], tx: Prisma.TransactionClient): Promise<void> {
  if (variantIds.length === 0) {
    return;
  }

  const [orderItem, cartItem, designItem, review] = await Promise.all([
    tx.orderItem.findFirst({ where: { variantId: { in: variantIds } }, select: { variantId: true } }),
    tx.cartItem.findFirst({ where: { variantId: { in: variantIds } }, select: { variantId: true } }),
    tx.designItem.findFirst({ where: { variantId: { in: variantIds } }, select: { variantId: true } }),
    tx.review.findFirst({ where: { variantId: { in: variantIds } }, select: { variantId: true } })
  ]);

  if (orderItem || cartItem || designItem || review) {
    throw new ApiError(409, "VARIANT_IN_USE", "Không thể xóa variant đang được tham chiếu bởi đơn hàng, giỏ hàng, thiết kế hoặc review");
  }
}

async function replaceVariants(productId: string, variants: UpdateVariantInput[], tx: Prisma.TransactionClient): Promise<void> {
  const existingVariants = await tx.productVariant.findMany({
    where: { productId },
    select: { id: true }
  });
  const existingIds = new Set(existingVariants.map((variant) => variant.id));
  const incomingIds = variants.map((variant) => variant.id).filter((id): id is string => Boolean(id));

  for (const incomingId of incomingIds) {
    if (!existingIds.has(incomingId)) {
      throw new ApiError(400, "VARIANT_NOT_FOUND", "Variant không thuộc sản phẩm này");
    }
  }

  const incomingIdSet = new Set(incomingIds);
  const idsToDelete = existingVariants.map((variant) => variant.id).filter((id) => !incomingIdSet.has(id));

  await assertVariantDeleteAllowed(idsToDelete, tx);

  if (idsToDelete.length > 0) {
    await tx.productVariant.deleteMany({ where: { id: { in: idsToDelete } } });
  }

  for (const variant of variants) {
    const data = {
      name: variant.name,
      type: variant.type,
      hexColor: variant.hexColor,
      textureUrl: variant.textureUrl,
      priceAddon: variant.priceAddon ?? 0,
      isDefault: variant.isDefault ?? false,
      stockQuantity: variant.stockQuantity
    };

    if (variant.id) {
      await tx.productVariant.update({
        where: { id: variant.id },
        data
      });
    } else {
      await tx.productVariant.create({
        data: {
          ...data,
          productId
        }
      });
    }
  }
}

function assertPriceAndArRules(existing: { basePrice: number; comparePrice: number | null; hasArSupport: boolean; modelUrl: string | null }, input: UpdateProductInput): void {
  const basePrice = input.basePrice ?? existing.basePrice;
  const comparePrice = input.comparePrice === undefined ? existing.comparePrice : input.comparePrice;
  const hasArSupport = input.hasArSupport ?? existing.hasArSupport;
  const modelUrl = input.modelUrl === undefined ? existing.modelUrl : input.modelUrl;

  if (comparePrice != null && comparePrice <= basePrice) {
    throw new ApiError(400, "INVALID_COMPARE_PRICE", "comparePrice phải lớn hơn basePrice");
  }

  if (hasArSupport && !modelUrl) {
    throw new ApiError(400, "MODEL_URL_REQUIRED", "modelUrl là bắt buộc khi hasArSupport=true");
  }
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      basePrice: true,
      comparePrice: true,
      hasArSupport: true,
      modelUrl: true
    }
  });

  if (!existing) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại");
  }

  assertPriceAndArRules(existing, input);

  if (input.categoryId !== undefined) {
    await ensureCategoryExists(input.categoryId);
  }

  const product = await prisma.$transaction(async (tx) => {
    if (input.variants !== undefined) {
      await replaceVariants(productId, input.variants, tx);
    }

    if (input.images !== undefined) {
      await tx.productImage.deleteMany({ where: { productId } });
      if (input.images.length > 0) {
        await tx.productImage.createMany({
          data: imageCreateData(input.images).map((image) => ({ ...image, productId }))
        });
      }
    }

    return tx.product.update({
      where: { id: productId },
      data: {
        ...(input.name === undefined ? {} : { name: input.name, slug: await generateUniqueSlug(input.name, productId) }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.categoryId === undefined ? {} : { category: { connect: { id: input.categoryId } } }),
        ...(input.basePrice === undefined ? {} : { basePrice: input.basePrice }),
        ...(input.comparePrice === undefined ? {} : { comparePrice: input.comparePrice }),
        ...(input.thumbnailUrl === undefined ? {} : { thumbnailUrl: input.thumbnailUrl }),
        ...(input.modelUrl === undefined ? {} : { modelUrl: input.modelUrl }),
        ...(input.hasArSupport === undefined ? {} : { hasArSupport: input.hasArSupport }),
        ...(input.dimensions === undefined ? {} : { dimensions: input.dimensions as Prisma.InputJsonValue }),
        ...(input.materials === undefined ? {} : { materials: input.materials }),
        ...(input.tags === undefined ? {} : { tags: input.tags }),
        ...(input.stockQuantity === undefined ? {} : { stockQuantity: input.stockQuantity })
      },
      include: productInclude
    });
  });

  return formatProductDetail(product, await buildRatingDistribution(product.id));
}

export async function softDeleteProduct(productId: string): Promise<void> {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true }
  });

  if (!existing) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại");
  }

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false }
  });
}
