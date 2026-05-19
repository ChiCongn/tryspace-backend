import { Router } from "express";

import * as wishlistController from "../controllers/wishlist.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { toggleWishlistSchema } from "../schemas/wishlist.schema";
import { asyncHandler } from "../utils/asyncHandler";

const wishlistRouter = Router();

wishlistRouter.use(authenticate);

wishlistRouter.get("/", asyncHandler(wishlistController.getWishlist));
wishlistRouter.post("/", validate(toggleWishlistSchema), asyncHandler(wishlistController.addToWishlist));
wishlistRouter.post("/toggle", validate(toggleWishlistSchema), asyncHandler(wishlistController.toggleWishlist));
wishlistRouter.get("/check/:productId", asyncHandler(wishlistController.checkWishlist));
wishlistRouter.delete("/:productId", asyncHandler(wishlistController.removeFromWishlist));

export default wishlistRouter;
