import { Router } from "express";

import * as searchController from "../controllers/search.controller";
import { asyncHandler } from "../utils/asyncHandler";

const searchRouter = Router();

searchRouter.get("/", asyncHandler(searchController.search));
searchRouter.get("/suggestions", asyncHandler(searchController.suggestions));

export default searchRouter;
