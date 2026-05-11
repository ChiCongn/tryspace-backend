import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";

import * as uploadController from "../controllers/upload.controller";
import { authenticate } from "../middleware/authenticate";
import { requireAdmin } from "../middleware/requireAdmin";
import { uploadLimiter } from "../middleware/rateLimiter";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const uploadRouter = Router();
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

function singleFile(req: Request, res: Response, next: NextFunction): void {
  memoryUpload.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new ApiError(413, "FILE_TOO_LARGE", "File vượt quá giới hạn kích thước"));
      return;
    }

    next(error);
  });
}

uploadRouter.post("/image", authenticate, uploadLimiter, singleFile, asyncHandler(uploadController.uploadImage));
uploadRouter.post("/model", authenticate, requireAdmin, uploadLimiter, singleFile, asyncHandler(uploadController.uploadModel));

export default uploadRouter;
