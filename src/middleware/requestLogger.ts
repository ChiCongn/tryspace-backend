import { randomUUID } from "node:crypto";
import type { Request, RequestHandler } from "express";

import { logger } from "../utils/logger";

const REQUEST_ID_HEADER = "x-request-id";
const DEFAULT_SLOW_REQUEST_MS = 1000;
const HEALTHCHECK_PATHS = new Set(["/health", "/api/v1/health"]);

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function incomingRequestId(req: Request): string | null {
  const value = req.headers[REQUEST_ID_HEADER];
  const requestId = Array.isArray(value) ? value[0] : value;

  if (!requestId || requestId.length > 128) {
    return null;
  }

  return requestId;
}

function shouldLogRequest(req: Request): boolean {
  if (process.env.LOG_HEALTHCHECKS === "true") {
    return true;
  }

  return !HEALTHCHECK_PATHS.has(req.path);
}

export const requestLogger: RequestHandler = (req, res, next) => {
  const requestId = incomingRequestId(req) ?? randomUUID();
  const startedAt = process.hrtime.bigint();
  const slowRequestMs = parsePositiveInteger(process.env.SLOW_REQUEST_MS, DEFAULT_SLOW_REQUEST_MS);

  req.requestId = requestId;
  req.log = logger.child({ context: "request logger", requestId });
  res.setHeader("X-Request-Id", requestId);

  if (shouldLogRequest(req)) {
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const isSlowRequest = durationMs >= slowRequestMs;
      const statusCode = res.statusCode;
      const level = statusCode >= 400 || isSlowRequest ? "warn" : "info";
      const roundedDurationMs = Math.round(durationMs * 100) / 100;
      const message =
        isSlowRequest && statusCode < 400
          ? `${req.method} ${req.originalUrl} was slow: ${roundedDurationMs}ms with ${statusCode} status`
          : `${req.method} ${req.originalUrl} completed with ${statusCode} in ${roundedDurationMs}ms`;

      req.log?.log(level, message, {
        method: req.method,
        path: req.originalUrl,
        statusCode,
        durationMs: roundedDurationMs,
        userId: req.user?.id
      });
    });
  }

  next();
};
