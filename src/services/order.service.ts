import { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import {
  adminOrdersQuerySchema,
  userOrdersQuerySchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput
} from "../schemas/order.schema";
import { ApiError } from "../utils/ApiError";
import { generate as generateOrderNumber } from "../utils/orderNumber";
import { buildPaginationMeta } from "../utils/pagination";

const ORDER_DEFAULT_LIMIT = 12;
const CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "CONFIRMED"];

const orderInclude = {
  user: {
    select: {
      id: true,
      email: true,
      displayName: true
    }
  },
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          thumbnailUrl: true
        }
      },
      variant: {
        select: {
          id: true,
          name: true,
          hexColor: true
        }
      }
    },
    orderBy: { id: "asc" }
  }
} satisfies Prisma.OrderInclude;

const cartItemInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnailUrl: true,
      basePrice: true,
      stockQuantity: true,
      isActive: true
    }
  },
  variant: {
    select: {
      id: true,
      name: true,
      priceAddon: true,
      stockQuantity: true,
      productId: true
    }
  }
} satisfies Prisma.CartItemInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type CartItemWithRelations = Prisma.CartItemGetPayload<{ include: typeof cartItemInclude }>;

function orderLimit(rawLimit: number | undefined): number {
  return Math.min(Math.max(rawLimit ?? ORDER_DEFAULT_LIMIT, 1), 100);
}

function currentStockQuantity(item: CartItemWithRelations): number | null {
  return item.variant?.stockQuantity ?? item.product.stockQuantity;
}

function currentUnitPrice(item: CartItemWithRelations): number {
  return item.product.basePrice + (item.variant?.priceAddon ?? 0);
}

function isCheckoutAvailable(item: CartItemWithRelations): boolean {
  const stockQuantity = currentStockQuantity(item);

  return item.product.isActive && (stockQuantity === null || stockQuantity > 0);
}

function assertStock(stockQuantity: number | null, requestedQty: number): void {
  if (stockQuantity === null) {
    return;
  }

  if (requestedQty > stockQuantity) {
    throw new ApiError(400, "INSUFFICIENT_STOCK", "Hết hàng ngay lúc checkout", {
      availableQuantity: stockQuantity
    });
  }
}

function formatOrderItem(item: OrderWithRelations["items"][number]) {
  return {
    id: item.id,
    product: item.product,
    variant: item.variant,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
    snapshot: item.snapshot
  };
}

function formatOrderDetail(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    user: order.user,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    items: order.items.map(formatOrderItem),
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    note: order.note,
    trackingNumber: order.trackingNumber,
    cancelledAt: order.cancelledAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

function formatOrderSummary(order: Prisma.OrderGetPayload<{ include: { _count: { select: { items: true } } } }>) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    itemCount: order._count.items,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

async function decrementStockForItem(item: CartItemWithRelations, tx: Prisma.TransactionClient): Promise<void> {
  const stockQuantity = currentStockQuantity(item);

  if (stockQuantity === null) {
    return;
  }

  if (item.variantId) {
    const result = await tx.productVariant.updateMany({
      where: {
        id: item.variantId,
        stockQuantity: { gte: item.quantity }
      },
      data: {
        stockQuantity: { decrement: item.quantity }
      }
    });

    if (result.count !== 1) {
      throw new ApiError(400, "INSUFFICIENT_STOCK", "Hết hàng ngay lúc checkout", {
        availableQuantity: stockQuantity
      });
    }

    return;
  }

  const result = await tx.product.updateMany({
    where: {
      id: item.productId,
      stockQuantity: { gte: item.quantity }
    },
    data: {
      stockQuantity: { decrement: item.quantity }
    }
  });

  if (result.count !== 1) {
    throw new ApiError(400, "INSUFFICIENT_STOCK", "Hết hàng ngay lúc checkout", {
      availableQuantity: stockQuantity
    });
  }
}

async function restoreStockForOrderItem(item: OrderWithRelations["items"][number], tx: Prisma.TransactionClient): Promise<void> {
  if (item.variantId) {
    const variant = await tx.productVariant.findUnique({
      where: { id: item.variantId },
      select: { stockQuantity: true }
    });

    if (variant?.stockQuantity !== null && variant?.stockQuantity !== undefined) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockQuantity: { increment: item.quantity } }
      });
    }

    return;
  }

  const product = await tx.product.findUnique({
    where: { id: item.productId },
    select: { stockQuantity: true }
  });

  if (product?.stockQuantity !== null && product?.stockQuantity !== undefined) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { increment: item.quantity } }
    });
  }
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const order = await prisma.$transaction(async (tx) => {
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: cartItemInclude,
      orderBy: { addedAt: "asc" }
    });

    if (cartItems.length === 0) {
      throw new ApiError(400, "CART_EMPTY", "Giỏ hàng trống");
    }

    if (cartItems.some((item) => !isCheckoutAvailable(item))) {
      throw new ApiError(400, "CART_HAS_UNAVAILABLE_ITEMS", "Có item không available trong giỏ hàng");
    }

    for (const item of cartItems) {
      assertStock(currentStockQuantity(item), item.quantity);
    }

    const subtotal = cartItems.reduce((sum, item) => sum + currentUnitPrice(item) * item.quantity, 0);
    const shippingFee = 0;
    const isMockPayment = input.paymentMethod === "MOCK";
    const createdOrder = await tx.order.create({
      data: {
        orderNumber: await generateOrderNumber(tx),
        userId,
        status: isMockPayment ? "CONFIRMED" : "PENDING_PAYMENT",
        paymentStatus: isMockPayment ? "PAID" : "PENDING",
        paymentMethod: input.paymentMethod,
        shippingAddress: input.shippingAddress as Prisma.InputJsonValue,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        note: input.note,
        items: {
          create: cartItems.map((item) => {
            const priceAddon = item.variant?.priceAddon ?? 0;
            const unitPrice = currentUnitPrice(item);

            return {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice,
              subtotal: unitPrice * item.quantity,
              snapshot: {
                productName: item.product.name,
                variantName: item.variant?.name ?? null,
                thumbnailUrl: item.product.thumbnailUrl,
                basePrice: item.product.basePrice,
                priceAddon,
                unitPrice
              }
            };
          })
        }
      },
      include: orderInclude
    });

    for (const item of cartItems) {
      await decrementStockForItem(item, tx);
    }

    await tx.cartItem.deleteMany({ where: { userId } });

    return createdOrder;
  });

  return formatOrderDetail(order);
}

export async function listUserOrders(userId: string, rawQuery: unknown) {
  const query = userOrdersQuerySchema.parse(rawQuery ?? {});
  const page = query.page ?? 1;
  const limit = orderLimit(query.limit);
  const skip = (page - 1) * limit;
  const where: Prisma.OrderWhereInput = {
    userId,
    ...(query.status ? { status: query.status } : {})
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ]);

  return {
    data: orders.map(formatOrderSummary),
    meta: buildPaginationMeta(total, page, limit)
  };
}

export async function getOrder(orderId: string, viewer: { id: string; role: string }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Đơn hàng không tồn tại");
  }

  if (viewer.role !== "ADMIN" && order.userId !== viewer.id) {
    throw new ApiError(403, "FORBIDDEN", "Không có quyền xem đơn hàng này");
  }

  return formatOrderDetail(order);
}

export async function cancelOrder(orderId: string, userId: string) {
  const order = await prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findFirst({
      where: {
        id: orderId,
        userId
      },
      include: orderInclude
    });

    if (!existingOrder) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Đơn hàng không tồn tại");
    }

    if (!CANCELLABLE_STATUSES.includes(existingOrder.status)) {
      throw new ApiError(400, "ORDER_CANNOT_BE_CANCELLED", "Không thể hủy đơn hàng ở trạng thái hiện tại", {
        currentStatus: existingOrder.status
      });
    }

    for (const item of existingOrder.items) {
      await restoreStockForOrderItem(item, tx);
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date()
      },
      include: orderInclude
    });
  });

  return {
    id: order.id,
    status: order.status,
    cancelledAt: order.cancelledAt
  };
}

export async function updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true }
  });

  if (!existingOrder) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Đơn hàng không tồn tại");
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: input.status,
      ...(input.status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      ...(input.trackingNumber === undefined ? {} : { trackingNumber: input.trackingNumber }),
      ...(input.note === undefined ? {} : { note: input.note })
    },
    include: orderInclude
  });

  return formatOrderDetail(order);
}

export async function listAdminOrders(rawQuery: unknown) {
  const query = adminOrdersQuerySchema.parse(rawQuery ?? {});
  const page = query.page ?? 1;
  const limit = orderLimit(query.limit);
  const skip = (page - 1) * limit;
  const where: Prisma.OrderWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.search ? { orderNumber: { contains: query.search, mode: "insensitive" } } : {}),
    ...(query.hasTracking === undefined ? {} : query.hasTracking ? { trackingNumber: { not: null } } : { trackingNumber: null })
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ]);

  return {
    data: orders.map(formatOrderSummary),
    meta: buildPaginationMeta(total, page, limit)
  };
}
