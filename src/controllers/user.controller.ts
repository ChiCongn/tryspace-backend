import type { Request, Response } from "express";

import * as authService from "../services/auth.service";
import * as userService from "../services/user.service";
import type { UpdateMeInput, UpdateUserStatusInput } from "../schemas/user.schema";
import { ApiError } from "../utils/ApiError";
import { sendPaginated, sendSuccess } from "../utils/response";

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, "AUTH_TOKEN_MISSING", "Không có access token");
  }

  return req.user.id;
}

export async function me(req: Request, res: Response): Promise<void> {
  const profile = await authService.getMe(requireUserId(req));

  sendSuccess(res, profile);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const user = await userService.updateMe(requireUserId(req), req.body as UpdateMeInput);

  sendSuccess(res, user);
}

export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  const profile = await userService.getPublicProfile(req.params.userId);

  sendSuccess(res, profile);
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const result = await userService.listUsers(req.query);

  sendPaginated(res, result.data, result.meta);
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const result = await userService.updateUserStatus(requireUserId(req), req.params.userId, req.body as UpdateUserStatusInput);

  sendSuccess(res, result);
}
