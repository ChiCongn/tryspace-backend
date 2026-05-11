import type { Request, Response } from "express";

import * as uploadService from "../services/upload.service";
import { sendSuccess } from "../utils/response";

export async function uploadImage(req: Request, res: Response): Promise<void> {
  const result = await uploadService.uploadImage(req.file, req.body?.purpose);

  sendSuccess(res, result, 201);
}

export async function uploadModel(req: Request, res: Response): Promise<void> {
  const result = await uploadService.uploadModel(req.file);

  sendSuccess(res, result, 201);
}
