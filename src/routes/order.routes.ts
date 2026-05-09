import { Router } from "express";

import * as orderController from "../controllers/order.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { createOrderSchema } from "../schemas/order.schema";
import { asyncHandler } from "../utils/asyncHandler";

const orderRouter = Router();

orderRouter.use(authenticate);

orderRouter.post("/", validate(createOrderSchema), asyncHandler(orderController.createOrder));
orderRouter.get("/", asyncHandler(orderController.listUserOrders));
orderRouter.get("/:id", asyncHandler(orderController.getOrder));
orderRouter.post("/:id/cancel", asyncHandler(orderController.cancelOrder));

export default orderRouter;
