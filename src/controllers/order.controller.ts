import type { Request, Response } from "express";

import type { CreateOrderInput, UpdateOrderStatusInput } from "../schemas/order.schema";
import * as orderService from "../services/order.service";
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

export async function createOrder(req: Request, res: Response): Promise<void> {
  const order = await orderService.createOrder(requireUser(req).id, req.body as CreateOrderInput);

  sendSuccess(res, order, 201);
}

export async function listUserOrders(req: Request, res: Response): Promise<void> {
  const result = await orderService.listUserOrders(requireUser(req).id, req.query);

  sendPaginated(res, result.data, result.meta);
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const order = await orderService.getOrder(req.params.id, requireUser(req));

  sendSuccess(res, order);
}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
  const order = await orderService.cancelOrder(req.params.id, requireUser(req).id);

  sendSuccess(res, order);
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const order = await orderService.updateOrderStatus(req.params.id, req.body as UpdateOrderStatusInput);

  sendSuccess(res, order);
}

export async function listAdminOrders(req: Request, res: Response): Promise<void> {
  const result = await orderService.listAdminOrders(req.query);

  sendPaginated(res, result.data, result.meta);
}
