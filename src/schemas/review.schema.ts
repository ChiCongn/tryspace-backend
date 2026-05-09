import { ReviewStatus } from "@prisma/client";
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

const optionalBooleanQuery = z
  .preprocess((value) => (value === undefined || value === "" ? undefined : value), z.enum(["true", "false"]).optional())
  .transform((value) => (value === undefined ? undefined : value === "true"));

export const reviewListQuerySchema = z.object({
  rating: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), z.coerce.number().int().min(1).max(5).optional()),
  hasImages: optionalBooleanQuery,
  sortBy: z.enum(["helpful", "createdAt", "rating"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating tối thiểu là 1").max(5, "Rating tối đa là 5"),
  title: z.string().trim().max(100, "Tiêu đề tối đa 100 ký tự").nullable().optional(),
  body: z.string().trim().max(2000, "Nội dung tối đa 2000 ký tự").nullable().optional(),
  variantId: z.string().min(1).nullable().optional(),
  images: z.array(cloudinaryUrlSchema).max(5, "Tối đa 5 ảnh").optional()
});

export const updateReviewSchema = createReviewSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Cần cung cấp ít nhất một trường để cập nhật"
  });

export const adminReplySchema = z.object({
  body: z.string().trim().min(1, "Nội dung phản hồi là bắt buộc").max(1000, "Phản hồi tối đa 1000 ký tự")
});

export const updateReviewStatusSchema = z
  .object({
    status: z.nativeEnum(ReviewStatus),
    reason: z.string().trim().max(500, "Lý do tối đa 500 ký tự").optional()
  })
  .refine((data) => data.status !== "REJECTED" || Boolean(data.reason), {
    path: ["reason"],
    message: "Lý do là bắt buộc khi từ chối review"
  });

export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type AdminReplyInput = z.infer<typeof adminReplySchema>;
export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
