import type { Request, Response } from "express";

import * as searchService from "../services/search.service";
import { sendSuccess } from "../utils/response";

export async function search(req: Request, res: Response): Promise<void> {
  const result = await searchService.search(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

export async function suggestions(req: Request, res: Response): Promise<void> {
  const result = await searchService.suggestions(req.query);

  sendSuccess(res, result);
}
