import type { CookieOptions, Request, Response } from "express";

import * as authService from "../services/auth.service";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "../schemas/auth.schema";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/response";

function refreshCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge
  };
}

function setRefreshCookie(res: Response, refreshToken: string, maxAge: number): void {
  res.cookie("refreshToken", refreshToken, refreshCookieOptions(maxAge));
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth"
  });
}

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, "AUTH_TOKEN_MISSING", "Không có access token");
  }

  return req.user.id;
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body as RegisterInput);

  setRefreshCookie(res, result.refreshToken, result.refreshTokenMaxAgeMs);
  sendSuccess(
    res,
    {
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        avatarUrl: result.user.avatarUrl,
        role: result.user.role,
        createdAt: result.user.createdAt
      }
    },
    201
  );
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginInput);

  setRefreshCookie(res, result.refreshToken, result.refreshTokenMaxAgeMs);
  sendSuccess(res, {
    tokens: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    },
    user: {
      id: result.user.id,
      email: result.user.email,
      displayName: result.user.displayName,
      avatarUrl: result.user.avatarUrl,
      role: result.user.role,
      lastLoginAt: result.user.lastLoginAt
    }
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const result = await authService.refresh(req.cookies?.refreshToken as string | undefined);

  setRefreshCookie(res, result.refreshToken, result.refreshTokenMaxAgeMs);
  sendSuccess(res, {
    accessToken: result.accessToken
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(requireUserId(req), req.cookies?.refreshToken as string | undefined);

  clearRefreshCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const profile = await authService.getMe(requireUserId(req));

  sendSuccess(res, profile);
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const result = await authService.changePassword(requireUserId(req), req.body as ChangePasswordInput);

  clearRefreshCookie(res);
  sendSuccess(res, result);
}
