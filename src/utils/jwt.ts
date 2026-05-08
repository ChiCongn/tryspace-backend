import crypto from "crypto";

import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

import { ApiError } from "./ApiError";

interface AccessTokenPayload {
  sub: string;
  role: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new ApiError(500, "INTERNAL_ERROR", "JWT_SECRET is not configured");
  }

  return secret;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as SignOptions["expiresIn"];

  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function signRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, getJwtSecret());

  if (typeof payload === "string") {
    throw new ApiError(401, "AUTH_TOKEN_INVALID", "Token không hợp lệ");
  }

  return payload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
