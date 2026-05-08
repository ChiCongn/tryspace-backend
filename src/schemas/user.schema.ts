import { Role } from "@prisma/client";
import { z } from "zod";

function isCloudinaryUrl(value: string): boolean {
  try {
    return new URL(value).hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

const displayNameSchema = z.string().min(2, "Tên hiển thị phải có ít nhất 2 ký tự").max(50, "Tên hiển thị tối đa 50 ký tự");

const cloudinaryUrlSchema = z
  .string()
  .url("URL không hợp lệ")
  .refine(isCloudinaryUrl, "URL phải thuộc domain res.cloudinary.com");

export const updateMeSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    avatarUrl: cloudinaryUrlSchema.nullable().optional()
  })
  .refine((data) => data.displayName !== undefined || data.avatarUrl !== undefined, {
    message: "Cần cung cấp ít nhất một trường để cập nhật"
  });

export const updateUserStatusSchema = z
  .object({
    isActive: z.boolean(),
    reason: z.string().max(500, "Lý do tối đa 500 ký tự").optional()
  })
  .refine((data) => data.isActive || Boolean(data.reason?.trim()), {
    path: ["reason"],
    message: "Lý do là bắt buộc khi vô hiệu hóa tài khoản"
  });

export const adminUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
