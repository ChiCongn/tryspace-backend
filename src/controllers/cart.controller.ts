import type { Request, Response } from "express";

import type { AddCartItemInput, UpdateCartItemInput } from "../schemas/cart.schema";
import * as cartService from "../services/cart.service";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/response";

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, "AUTH_TOKEN_MISSING", "Không có access token");
  }

  return req.user.id;
}

export async function getCart(req: Request, res: Response): Promise<void> {
  const cart = await cartService.getCart(requireUserId(req));

  sendSuccess(res, cart);
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const cart = await cartService.addItem(requireUserId(req), req.body as AddCartItemInput);

  sendSuccess(res, cart);
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const cart = await cartService.updateItem(requireUserId(req), req.params.itemId, req.body as UpdateCartItemInput);

  sendSuccess(res, cart);
}

export async function deleteItem(req: Request, res: Response): Promise<void> {
  const cart = await cartService.deleteItem(requireUserId(req), req.params.itemId);

  sendSuccess(res, cart);
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  const cart = await cartService.clearCart(requireUserId(req));

  sendSuccess(res, cart);
}

export async function syncCart(req: Request, res: Response): Promise<void> {
  const cart = await cartService.syncCart(requireUserId(req), req.body.items || []);

  sendSuccess(res, cart);
}
