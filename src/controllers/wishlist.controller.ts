import type { Request, Response } from "express";

import type { ToggleWishlistInput } from "../schemas/wishlist.schema";
import * as wishlistService from "../services/wishlist.service";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/response";

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, "AUTH_TOKEN_MISSING", "Không có access token");
  }

  return req.user.id;
}

export async function getWishlist(req: Request, res: Response): Promise<void> {
  const wishlist = await wishlistService.getWishlist(requireUserId(req));

  sendSuccess(res, wishlist);
}

export async function toggleWishlist(req: Request, res: Response): Promise<void> {
  const result = await wishlistService.toggleWishlist(requireUserId(req), req.body as ToggleWishlistInput);

  sendSuccess(res, result);
}

export async function checkWishlist(req: Request, res: Response): Promise<void> {
  const result = await wishlistService.checkWishlist(requireUserId(req), req.params.productId);

  sendSuccess(res, result);
}
