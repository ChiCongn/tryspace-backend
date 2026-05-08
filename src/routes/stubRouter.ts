import { Router } from "express";

import { ApiError } from "../utils/ApiError";

export function createStubRouter(moduleName: string): Router {
  const router = Router();

  router.all("*", (_req, _res, next) => {
    next(new ApiError(501, "NOT_IMPLEMENTED", `${moduleName} module is not implemented yet`));
  });

  return router;
}
