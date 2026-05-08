import { Router } from "express";

import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { authLoginLimiter, authRefreshLimiter, authRegisterLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { changePasswordSchema, loginSchema, registerSchema } from "../schemas/auth.schema";
import { asyncHandler } from "../utils/asyncHandler";

const authRouter = Router();

authRouter.post("/register", authRegisterLimiter, validate(registerSchema), asyncHandler(authController.register));
authRouter.post("/login", authLoginLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.post("/refresh", authRefreshLimiter, asyncHandler(authController.refresh));
authRouter.post("/logout", authenticate, asyncHandler(authController.logout));
authRouter.get("/me", authenticate, asyncHandler(authController.me));
authRouter.patch("/change-password", authenticate, validate(changePasswordSchema), asyncHandler(authController.changePassword));

export default authRouter;
