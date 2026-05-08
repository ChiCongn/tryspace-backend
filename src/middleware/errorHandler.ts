import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { ApiError } from "../utils/ApiError";

function uniqueConstraintCode(target: unknown): string {
  const field = Array.isArray(target) ? String(target[0] ?? "") : String(target ?? "");

  if (field.toLowerCase().includes("email")) {
    return "EMAIL_ALREADY_EXISTS";
  }

  return "CONFLICT";
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details === undefined ? {} : { details: err.details })
      }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dữ liệu không hợp lệ",
        details: err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      }
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({
      success: false,
      error: {
        code: uniqueConstraintCode(err.meta?.target),
        message: "Dữ liệu đã tồn tại",
        details: err.meta
      }
    });
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Lỗi server",
      ...(isProduction ? {} : { details: err instanceof Error ? err.stack : err })
    }
  });
};
