import type { Request, Response } from "express";

import * as productService from "../services/product.service";
import type { CreateProductInput, UpdateProductInput } from "../schemas/product.schema";
import { sendPaginated, sendSuccess } from "../utils/response";

export async function listProducts(req: Request, res: Response): Promise<void> {
  const result = await productService.listProducts(req.query);

  sendPaginated(res, result.data, result.meta);
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.getProduct(req.params.idOrSlug, req.user?.role);

  sendSuccess(res, product);
}

export async function getRelatedProducts(req: Request, res: Response): Promise<void> {
  const products = await productService.getRelatedProducts(req.params.id);

  sendSuccess(res, products);
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.createProduct(req.body as CreateProductInput);

  sendSuccess(res, product, 201);
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.updateProduct(req.params.id, req.body as UpdateProductInput);

  sendSuccess(res, product);
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  await productService.softDeleteProduct(req.params.id);

  res.status(204).send();
}
