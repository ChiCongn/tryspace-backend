import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/ApiError";

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new ApiError(401, "AUTH_TOKEN_MISSING", "Không có access token"));
    return;
  }

  if (req.user.role !== "ADMIN") {
    next(new ApiError(403, "FORBIDDEN", "Không có quyền thực hiện thao tác này"));
    return;
  }

  next();
}
