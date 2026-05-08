import { Router } from "express";

import * as categoryController from "../controllers/category.controller";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { adminLimiter } from "../middleware/rateLimiter";
import { requireAdmin } from "../middleware/requireAdmin";
import { validate } from "../middleware/validate";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema";
import { updateUserStatusSchema } from "../schemas/user.schema";
import { asyncHandler } from "../utils/asyncHandler";

const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin, adminLimiter);

adminRouter.get("/users", asyncHandler(userController.listUsers));
adminRouter.patch("/users/:userId/status", validate(updateUserStatusSchema), asyncHandler(userController.updateUserStatus));

adminRouter.post("/categories", validate(createCategorySchema), asyncHandler(categoryController.createCategory));
adminRouter.patch("/categories/:id", validate(updateCategorySchema), asyncHandler(categoryController.updateCategory));
adminRouter.delete("/categories/:id", asyncHandler(categoryController.deleteCategory));

export default adminRouter;
