import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

const errorLogger = logger.child({ context: "error handler" });

function uniqueConstraintCode(target: unknown): string {
  const field = Array.isArray(target) ? String(target[0] ?? "") : String(target ?? "");

  if (field.toLowerCase().includes("email")) {
    return "EMAIL_ALREADY_EXISTS";
  }

  return "CONFLICT";
}

function errorSummary(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

function validationSummary(details: Array<{ field: string; message: string }>): string {
  const summary = details.map((detail) => `${detail.field || "body"}: ${detail.message}`).join("; ");

  return summary || "body: Dữ liệu không hợp lệ";
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      errorLogger.error(`API error ${err.statusCode} ${err.code} for ${req.method} ${req.originalUrl}: ${err.message}`, {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: err.statusCode,
        code: err.code,
        userId: req.user?.id,
        error: err
      });
    }

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
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }));

    errorLogger.warn(`Validation failed for ${req.method} ${req.originalUrl}: ${validationSummary(details)}`, {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: 400,
      userId: req.user?.id,
      details
    });

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dữ liệu không hợp lệ",
        details
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

  errorLogger.error(`Unhandled request error for ${req.method} ${req.originalUrl}: ${errorSummary(err)}`, {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: 500,
    userId: req.user?.id,
    error: err
  });

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Lỗi server",
      ...(isProduction ? {} : { details: err instanceof Error ? err.stack : err })
    }
  });
};
