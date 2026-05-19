import { prisma } from "../lib/prisma";
import type { ToggleWishlistInput } from "../schemas/wishlist.schema";
import { ApiError } from "../utils/ApiError";

function formatWishlistItem(item: Awaited<ReturnType<typeof wishlistItemPayload>>[number]) {
  return {
    id: item.id,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      thumbnailUrl: item.product.thumbnailUrl,
      basePrice: item.product.basePrice,
      comparePrice: item.product.comparePrice,
      averageRating: item.product.averageRating,
      totalReviews: item.product.totalReviews,
      isActive: item.product.isActive
    },
    addedAt: item.addedAt
  };
}

async function wishlistItemPayload(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          thumbnailUrl: true,
          basePrice: true,
          comparePrice: true,
          averageRating: true,
          totalReviews: true,
          isActive: true
        }
      }
    },
    orderBy: { addedAt: "desc" }
  });
}

export async function getWishlist(userId: string) {
  const items = await wishlistItemPayload(userId);

  return {
    items: items.map(formatWishlistItem),
    totalItems: items.length
  };
}

export async function toggleWishlist(userId: string, input: ToggleWishlistInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true }
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại");
  }

  const existingItem = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: input.productId
      }
    }
  });

  if (existingItem) {
    await prisma.wishlistItem.delete({ where: { id: existingItem.id } });

    return {
      productId: input.productId,
      action: "removed" as const,
      totalItems: await prisma.wishlistItem.count({ where: { userId } })
    };
  }

  await prisma.wishlistItem.create({
    data: {
      userId,
      productId: input.productId
    }
  });

  return {
    productId: input.productId,
    action: "added" as const,
    totalItems: await prisma.wishlistItem.count({ where: { userId } })
  };
}

export async function addToWishlist(userId: string, input: ToggleWishlistInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true }
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại");
  }

  const existingItem = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: input.productId
      }
    },
    select: { id: true }
  });

  if (!existingItem) {
    await prisma.wishlistItem.create({
      data: {
        userId,
        productId: input.productId
      }
    });
  }

  return {
    productId: input.productId,
    action: "added" as const,
    totalItems: await prisma.wishlistItem.count({ where: { userId } })
  };
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({
    where: {
      userId,
      productId
    }
  });

  return {
    productId,
    action: "removed" as const,
    totalItems: await prisma.wishlistItem.count({ where: { userId } })
  };
}

export async function checkWishlist(userId: string, productId: string) {
  const item = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId
      }
    },
    select: { id: true }
  });

  return {
    productId,
    isInWishlist: item !== null
  };
}
