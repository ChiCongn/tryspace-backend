import type { Request, Response } from "express";

import type { CreateDesignInput, UpdateDesignInput } from "../schemas/design.schema";
import * as designService from "../services/design.service";
import { ApiError } from "../utils/ApiError";
import { sendPaginated, sendSuccess } from "../utils/response";

function requireUser(req: Request): { id: string; role: string } {
  if (!req.user) {
    throw new ApiError(401, "AUTH_TOKEN_MISSING", "Không có access token");
  }

  return {
    id: req.user.id,
    role: req.user.role
  };
}

export async function listDesigns(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const result = await designService.listDesigns(user.id, req.query);

  sendPaginated(res, result.data, result.meta);
}

export async function createDesign(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const design = await designService.createDesign(user.id, req.body as CreateDesignInput);

  sendSuccess(res, design, 201);
}

export async function getDesign(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const design = await designService.getDesign(req.params.id, user.id, user.role);

  sendSuccess(res, design);
}

export async function getSharedDesign(req: Request, res: Response): Promise<void> {
  const design = await designService.getSharedDesign(req.params.shareToken);

  sendSuccess(res, design);
}

export async function updateDesign(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const design = await designService.updateDesign(req.params.id, user.id, user.role, req.body as UpdateDesignInput);

  sendSuccess(res, design);
}

export async function deleteDesign(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  await designService.deleteDesign(req.params.id, user.id, user.role);

  res.status(204).send();
}

export async function cloneSharedDesign(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const design = await designService.cloneSharedDesign(req.params.shareToken, user.id);

  sendSuccess(res, design, 201);
}

export async function cloneDesign(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const design = await designService.cloneDesign(req.params.id, user.id, user.role);

  sendSuccess(res, design, 201);
}

export async function addAllToCart(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const result = await designService.addAllToCart(req.params.id, user.id, user.role);

  sendSuccess(res, result);
}
