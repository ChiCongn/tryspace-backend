import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().min(1, "productId là bắt buộc"),
  variantId: z.string().min(1).nullable().optional(),
  quantity: z.number().int().min(1, "Số lượng tối thiểu là 1").max(99, "Số lượng tối đa là 99")
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Số lượng tối thiểu là 1").max(99, "Số lượng tối đa là 99")
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
