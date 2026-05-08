import type { Request, Response } from "express";

import * as categoryService from "../services/category.service";
import type { CreateCategoryInput, UpdateCategoryInput } from "../schemas/category.schema";
import { sendSuccess } from "../utils/response";

export async function listCategories(_req: Request, res: Response): Promise<void> {
  const categories = await categoryService.listCategories();

  sendSuccess(res, categories);
}

export async function getCategoryBySlug(req: Request, res: Response): Promise<void> {
  const category = await categoryService.getCategoryBySlug(req.params.slug);

  sendSuccess(res, category);
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const category = await categoryService.createCategory(req.body as CreateCategoryInput);

  sendSuccess(res, category, 201);
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const category = await categoryService.updateCategory(req.params.id, req.body as UpdateCategoryInput);

  sendSuccess(res, category);
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  await categoryService.deleteCategory(req.params.id);

  res.status(204).send();
}
