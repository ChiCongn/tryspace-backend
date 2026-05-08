import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, "Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số");

const displayNameSchema = z
  .string()
  .min(2, "Tên hiển thị phải có ít nhất 2 ký tự")
  .max(50, "Tên hiển thị tối đa 50 ký tự")
  .regex(/^[a-zA-ZÀ-ỹ\s-]+$/, "Tên hiển thị chỉ được chứa chữ cái, dấu cách và dấu gạch ngang");

export const registerSchema = z.object({
  email: z.string().email("Email không đúng định dạng").max(255).transform((email) => email.toLowerCase()),
  password: passwordSchema,
  displayName: displayNameSchema
});

export const loginSchema = z.object({
  email: z.string().email("Email không đúng định dạng").max(255).transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Mật khẩu là bắt buộc")
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
    newPassword: passwordSchema
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Mật khẩu mới không được trùng mật khẩu hiện tại"
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
