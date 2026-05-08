import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1] ?? null;
}

async function attachUserFromToken(req: Request, token: string): Promise<void> {
  try {
    const payload = verifyAccessToken(token);
    const userId = payload.sub;

    if (!userId || typeof userId !== "string") {
      throw new ApiError(401, "AUTH_TOKEN_INVALID", "Token không hợp lệ");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ApiError(401, "AUTH_TOKEN_INVALID", "Token không hợp lệ");
    }

    if (!user.isActive) {
      throw new ApiError(403, "ACCOUNT_INACTIVE", "Tài khoản đã bị vô hiệu hóa");
    }

    req.user = user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "AUTH_TOKEN_INVALID", "Token đã hết hạn");
    }

    throw new ApiError(401, "AUTH_TOKEN_INVALID", "Token không hợp lệ");
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);

  if (!token) {
    next(new ApiError(401, "AUTH_TOKEN_MISSING", "Không có access token"));
    return;
  }

  try {
    await attachUserFromToken(req, token);
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    await attachUserFromToken(req, token);
    next();
  } catch (error) {
    next(error);
  }
}
