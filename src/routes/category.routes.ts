import { Router } from "express";

import * as categoryController from "../controllers/category.controller";
import { asyncHandler } from "../utils/asyncHandler";

const categoryRouter = Router();

categoryRouter.get("/", asyncHandler(categoryController.listCategories));
categoryRouter.get("/:slug", asyncHandler(categoryController.getCategoryBySlug));

export default categoryRouter;
