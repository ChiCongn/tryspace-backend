import type { User } from "@prisma/client";
import type { Logger } from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      log?: Logger;
      requestId?: string;
      user?: User;
    }
  }
}

export {};
