import { Router } from "express";

import * as productController from "../controllers/product.controller";
import * as reviewController from "../controllers/review.controller";
import { authenticate, optionalAuthenticate } from "../middleware/authenticate";
import { requireAdmin } from "../middleware/requireAdmin";
import { validate } from "../middleware/validate";
import { createReviewSchema, updateReviewSchema } from "../schemas/review.schema";
import { asyncHandler } from "../utils/asyncHandler";

const productRouter = Router();

productRouter.get("/", asyncHandler(productController.listProducts));
productRouter.get("/:id/related", asyncHandler(productController.getRelatedProducts));
productRouter.get("/:productId/reviews", optionalAuthenticate, asyncHandler(reviewController.listProductReviews));
productRouter.post("/:productId/reviews", authenticate, validate(createReviewSchema), asyncHandler(reviewController.createReview));
productRouter.patch("/:productId/reviews/:reviewId", authenticate, validate(updateReviewSchema), asyncHandler(reviewController.updateReview));
productRouter.delete("/:productId/reviews/:reviewId", authenticate, requireAdmin, asyncHandler(reviewController.deleteReview));
productRouter.post("/:productId/reviews/:reviewId/helpful", authenticate, asyncHandler(reviewController.toggleHelpful));
productRouter.get("/:idOrSlug", optionalAuthenticate, asyncHandler(productController.getProduct));

export default productRouter;
