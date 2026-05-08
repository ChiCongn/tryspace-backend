import { Router } from "express";

import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { updateMeSchema } from "../schemas/user.schema";
import { asyncHandler } from "../utils/asyncHandler";

const userRouter = Router();

userRouter.get("/me", authenticate, asyncHandler(userController.me));
userRouter.patch("/me", authenticate, validate(updateMeSchema), asyncHandler(userController.updateMe));
userRouter.get("/:userId", asyncHandler(userController.getPublicProfile));

export default userRouter;
