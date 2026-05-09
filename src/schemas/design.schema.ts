import { z } from "zod";

const transformVectorSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number()
});

const transformSchema = z.object({
  position: transformVectorSchema,
  rotation: transformVectorSchema,
  scale: z.number().min(0.1, "Scale tối thiểu là 0.1").max(10, "Scale tối đa là 10")
});

const thumbnailSchema = z
  .string()
  .startsWith("data:image/", "Thumbnail phải là data:image base64 string")
  .refine((value) => value.includes(";base64,"), "Thumbnail phải là base64 data URL")
  .refine((value) => {
    const base64 = value.split(";base64,")[1] ?? "";
    return Buffer.byteLength(base64, "base64") <= 5 * 1024 * 1024;
  }, "Thumbnail tối đa 5MB sau khi decode");

const designItemSchema = z.object({
  productId: z.string().min(1, "productId là bắt buộc"),
  variantId: z.string().min(1).nullable().optional(),
  transform: transformSchema
});

export const listDesignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).optional()
});

export const createDesignSchema = z.object({
  name: z.string().trim().min(1, "Tên design là bắt buộc").max(100, "Tên design tối đa 100 ký tự"),
  thumbnail: thumbnailSchema.optional(),
  items: z.array(designItemSchema).min(1, "Design cần ít nhất 1 item").max(20, "Tối đa 20 items")
});

export const updateDesignSchema = z
  .object({
    name: z.string().trim().min(1, "Tên design là bắt buộc").max(100, "Tên design tối đa 100 ký tự").optional(),
    thumbnail: thumbnailSchema.optional(),
    items: z.array(designItemSchema).min(1, "Design cần ít nhất 1 item").max(20, "Tối đa 20 items").optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Cần cung cấp ít nhất một trường để cập nhật"
  });

export type ListDesignsQuery = z.infer<typeof listDesignsQuerySchema>;
export type CreateDesignInput = z.infer<typeof createDesignSchema>;
export type UpdateDesignInput = z.infer<typeof updateDesignSchema>;
export type DesignItemInput = z.infer<typeof designItemSchema>;
