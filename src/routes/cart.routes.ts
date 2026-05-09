import { Router } from "express";

import * as cartController from "../controllers/cart.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { addCartItemSchema, updateCartItemSchema } from "../schemas/cart.schema";
import { asyncHandler } from "../utils/asyncHandler";

const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get("/", asyncHandler(cartController.getCart));
cartRouter.post("/items", validate(addCartItemSchema), asyncHandler(cartController.addItem));
cartRouter.patch("/items/:itemId", validate(updateCartItemSchema), asyncHandler(cartController.updateItem));
cartRouter.delete("/items/:itemId", asyncHandler(cartController.deleteItem));
cartRouter.delete("/", asyncHandler(cartController.clearCart));

export default cartRouter;
