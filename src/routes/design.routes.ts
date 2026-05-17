import { Router } from "express";

import * as designController from "../controllers/design.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { createDesignSchema, updateDesignSchema } from "../schemas/design.schema";
import { asyncHandler } from "../utils/asyncHandler";

const designRouter = Router();

designRouter.get("/shared/:shareToken", asyncHandler(designController.getSharedDesign));
designRouter.post("/shared/:shareToken/clone", authenticate, asyncHandler(designController.cloneSharedDesign));

designRouter.use(authenticate);

designRouter.get("/", asyncHandler(designController.listDesigns));
designRouter.post("/", validate(createDesignSchema), asyncHandler(designController.createDesign));
designRouter.get("/:id", asyncHandler(designController.getDesign));
designRouter.post("/:id/clone", asyncHandler(designController.cloneDesign));
designRouter.patch("/:id", validate(updateDesignSchema), asyncHandler(designController.updateDesign));
designRouter.delete("/:id", asyncHandler(designController.deleteDesign));
designRouter.post("/:id/add-all-to-cart", asyncHandler(designController.addAllToCart));

export default designRouter;
