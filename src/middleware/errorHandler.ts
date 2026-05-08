import type { ErrorRequestHandler } from "express";

interface HttpError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? "INTERNAL_ERROR";
  const message = statusCode === 500 ? "Internal server error" : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(err.details === undefined ? {} : { details: err.details })
    }
  });
};
