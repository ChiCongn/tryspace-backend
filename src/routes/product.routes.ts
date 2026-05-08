import { Router } from "express";

import * as productController from "../controllers/product.controller";
import { optionalAuthenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

const productRouter = Router();

productRouter.get("/", asyncHandler(productController.listProducts));
productRouter.get("/:id/related", asyncHandler(productController.getRelatedProducts));
productRouter.get("/:idOrSlug", optionalAuthenticate, asyncHandler(productController.getProduct));

export default productRouter;
