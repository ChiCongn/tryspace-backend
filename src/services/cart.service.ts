import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { AddCartItemInput, UpdateCartItemInput } from "../schemas/cart.schema";
import { ApiError } from "../utils/ApiError";

const cartItemInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnailUrl: true,
      isActive: true,
      basePrice: true,
      stockQuantity: true
    }
  },
  variant: {
    select: {
      id: true,
      name: true,
      hexColor: true,
      priceAddon: true,
      stockQuantity: true,
      productId: true
    }
  }
} satisfies Prisma.CartItemInclude;

type CartItemWithRelations = Prisma.CartItemGetPayload<{ include: typeof cartItemInclude }>;

export function checkStock(stockQuantity: number | null, requestedQty: number): void {
  if (stockQuantity === null) {
    return;
  }

  if (stockQuantity === 0) {
    throw new ApiError(400, "OUT_OF_STOCK", "Sản phẩm đã hết hàng");
  }

  if (requestedQty > stockQuantity) {
    throw new ApiError(400, "INSUFFICIENT_STOCK", "Số lượng yêu cầu vượt quá tồn kho", {
      availableQuantity: stockQuantity
    });
  }
}

function currentStockQuantity(item: CartItemWithRelations): number | null {
  return item.variant?.stockQuantity ?? item.product.stockQuantity;
}

function currentUnitPrice(item: CartItemWithRelations): number {
  return item.product.basePrice + (item.variant?.priceAddon ?? 0);
}

function isItemAvailable(item: CartItemWithRelations): boolean {
  const stockQuantity = currentStockQuantity(item);

  return item.product.isActive && (stockQuantity === null || stockQuantity >= item.quantity);
}

function formatCart(userId: string, items: CartItemWithRelations[]) {
  const formattedItems = items.map((item) => {
    const stockQuantity = currentStockQuantity(item);
    const unitPrice = currentUnitPrice(item);
    const subtotal = unitPrice * item.quantity;
    const isAvailable = isItemAvailable(item);

    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        thumbnailUrl: item.product.thumbnailUrl,
        isActive: item.product.isActive
      },
      variant: item.variant
        ? {
            id: item.variant.id,
            name: item.variant.name,
            hexColor: item.variant.hexColor
          }
        : null,
      quantity: item.quantity,
      unitPrice,
      currentPrice: unitPrice,
      priceAtAdd: unitPrice,
      subtotal,
      isAvailable,
      stockQuantity,
      addedAt: item.addedAt,
      updatedAt: item.updatedAt
    };
  });

  return {
    id: userId,
    items: formattedItems,
    summary: {
      itemCount: formattedItems.length,
      totalQuantity: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: formattedItems.reduce((sum, item) => sum + item.subtotal, 0),
      unavailableItems: formattedItems.filter((item) => !item.isAvailable).length
    }
  };
}

export async function getCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: cartItemInclude,
    orderBy: { addedAt: "asc" }
  });

  return formatCart(userId, items);
}

async function getActiveProduct(productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true
    },
    select: {
      id: true,
      stockQuantity: true
    }
  });

  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product không tồn tại hoặc inactive");
  }

  return product;
}

async function getVariantForProduct(productId: string, variantId: string | null | undefined) {
  if (!variantId) {
    return null;
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId
    },
    select: {
      id: true,
      stockQuantity: true
    }
  });

  if (!variant) {
    throw new ApiError(400, "INVALID_VARIANT", "variantId không thuộc product này");
  }

  return variant;
}

export async function addItem(userId: string, input: AddCartItemInput) {
  const product = await getActiveProduct(input.productId);
  const variant = await getVariantForProduct(input.productId, input.variantId);
  const variantId = input.variantId ?? null;
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      userId,
      productId: input.productId,
      variantId
    },
    select: {
      id: true,
      quantity: true
    }
  });
  const nextQuantity = (existingItem?.quantity ?? 0) + input.quantity;

  checkStock(variant?.stockQuantity ?? product.stockQuantity, nextQuantity);

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: nextQuantity }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        userId,
        productId: input.productId,
        variantId,
        quantity: input.quantity
      }
    });
  }

  return getCart(userId);
}

async function getOwnedCartItem(userId: string, itemId: string): Promise<CartItemWithRelations> {
  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      userId
    },
    include: cartItemInclude
  });

  if (!item) {
    throw new ApiError(404, "CART_ITEM_NOT_FOUND", "Cart item không tồn tại");
  }

  return item;
}

export async function updateItem(userId: string, itemId: string, input: UpdateCartItemInput) {
  const item = await getOwnedCartItem(userId, itemId);

  if (!item.product.isActive) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product không tồn tại hoặc inactive");
  }

  checkStock(currentStockQuantity(item), input.quantity);

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: input.quantity }
  });

  return getCart(userId);
}

export async function deleteItem(userId: string, itemId: string) {
  await getOwnedCartItem(userId, itemId);
  await prisma.cartItem.delete({ where: { id: itemId } });

  return getCart(userId);
}

export async function clearCart(userId: string) {
  await prisma.cartItem.deleteMany({ where: { userId } });

  return getCart(userId);
}

export async function syncCart(userId: string, items: any[]) {
  // Clear existing cart items
  await prisma.cartItem.deleteMany({ where: { userId } });

  // Add new items from sync request
  for (const item of items) {
    const product = await getActiveProduct(item.productId);
    const variant = await getVariantForProduct(item.productId, item.variantId);
    const variantId = item.variantId ?? null;

    checkStock(variant?.stockQuantity ?? product.stockQuantity, item.quantity);

    await prisma.cartItem.create({
      data: {
        userId,
        productId: item.productId,
        variantId,
        quantity: item.quantity
      }
    });
  }

  return getCart(userId);
}
