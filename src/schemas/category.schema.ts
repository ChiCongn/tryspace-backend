import { z } from "zod";

function isCloudinaryUrl(value: string): boolean {
  try {
    return new URL(value).hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

const cloudinaryUrlSchema = z
  .string()
  .url("URL không hợp lệ")
  .refine(isCloudinaryUrl, "URL phải thuộc domain res.cloudinary.com");

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Tên danh mục phải có ít nhất 2 ký tự").max(100, "Tên danh mục tối đa 100 ký tự"),
  description: z.string().trim().max(500, "Mô tả tối đa 500 ký tự").nullable().optional(),
  iconUrl: cloudinaryUrlSchema.nullable().optional(),
  thumbnailUrl: cloudinaryUrlSchema.nullable().optional(),
  displayOrder: z.number().int().min(1, "Thứ tự hiển thị phải lớn hơn hoặc bằng 1").optional()
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Cần cung cấp ít nhất một trường để cập nhật"
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
