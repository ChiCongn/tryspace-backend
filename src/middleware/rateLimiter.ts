import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

function rateLimitHandler(_req: Request, res: Response): void {
  res.status(429).json({
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Quá nhiều requests"
    }
  });
}

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const authRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? "unknown",
  handler: rateLimitHandler
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? "unknown",
  handler: rateLimitHandler
});

export const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});
