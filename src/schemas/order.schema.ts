import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { z } from "zod";

const optionalBooleanQuery = z
  .preprocess((value) => (value === undefined || value === "" ? undefined : value), z.enum(["true", "false"]).optional())
  .transform((value) => (value === undefined ? undefined : value === "true"));
const paymentMethodSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.toUpperCase() : value),
  z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Phương thức thanh toán không hợp lệ" })
  })
);

export const shippingAddressSchema = z.object({
  fullName: z
    .string({ required_error: "Tên người nhận là bắt buộc" })
    .trim()
    .min(2, "Tên người nhận phải có ít nhất 2 ký tự")
    .max(100, "Tên người nhận tối đa 100 ký tự"),
  phone: z
    .string({ required_error: "Số điện thoại là bắt buộc" })
    .regex(/^(0|84)(3|5|7|8|9)\d{8}$/, "Số điện thoại Việt Nam không hợp lệ"),
  addressLine1: z
    .string({ required_error: "Địa chỉ là bắt buộc" })
    .trim()
    .min(5, "Địa chỉ phải có ít nhất 5 ký tự")
    .max(200, "Địa chỉ tối đa 200 ký tự"),
  addressLine2: z.string().trim().max(200, "Địa chỉ bổ sung tối đa 200 ký tự").optional(),
  city: z.string({ required_error: "Quận/huyện là bắt buộc" }).trim().min(1, "Quận/huyện là bắt buộc"),
  province: z.string({ required_error: "Tỉnh/thành là bắt buộc" }).trim().min(1, "Tỉnh/thành là bắt buộc")
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: paymentMethodSchema,
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional()
});

export const userOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const adminOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  userId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  hasTracking: optionalBooleanQuery,
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().trim().max(100, "Mã vận đơn tối đa 100 ký tự").optional(),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional()
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UserOrdersQuery = z.infer<typeof userOrdersQuerySchema>;
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
