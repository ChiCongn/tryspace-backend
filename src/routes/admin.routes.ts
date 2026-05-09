import { Router } from "express";

import * as categoryController from "../controllers/category.controller";
import * as orderController from "../controllers/order.controller";
import * as productController from "../controllers/product.controller";
import * as reviewController from "../controllers/review.controller";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { adminLimiter } from "../middleware/rateLimiter";
import { requireAdmin } from "../middleware/requireAdmin";
import { validate } from "../middleware/validate";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema";
import { updateOrderStatusSchema } from "../schemas/order.schema";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema";
import { adminReplySchema, updateReviewStatusSchema } from "../schemas/review.schema";
import { updateUserStatusSchema } from "../schemas/user.schema";
import { asyncHandler } from "../utils/asyncHandler";

const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin, adminLimiter);

adminRouter.get("/users", asyncHandler(userController.listUsers));
adminRouter.patch("/users/:userId/status", validate(updateUserStatusSchema), asyncHandler(userController.updateUserStatus));

adminRouter.get("/orders", asyncHandler(orderController.listAdminOrders));
adminRouter.patch("/orders/:id/status", validate(updateOrderStatusSchema), asyncHandler(orderController.updateOrderStatus));

adminRouter.post("/categories", validate(createCategorySchema), asyncHandler(categoryController.createCategory));
adminRouter.patch("/categories/:id", validate(updateCategorySchema), asyncHandler(categoryController.updateCategory));
adminRouter.delete("/categories/:id", asyncHandler(categoryController.deleteCategory));

adminRouter.post("/products", validate(createProductSchema), asyncHandler(productController.createProduct));
adminRouter.patch("/products/:id", validate(updateProductSchema), asyncHandler(productController.updateProduct));
adminRouter.delete("/products/:id", asyncHandler(productController.deleteProduct));
adminRouter.post("/products/:productId/reviews/:reviewId/reply", validate(adminReplySchema), asyncHandler(reviewController.replyToReview));
adminRouter.patch("/products/:productId/reviews/:reviewId/status", validate(updateReviewStatusSchema), asyncHandler(reviewController.updateReviewStatus));

export default adminRouter;
