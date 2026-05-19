declare module "cors" {
  import type { RequestHandler } from "express";

  type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;
  type CorsOriginDelegate = (origin: string | undefined, callback: CorsOriginCallback) => void;

  interface CorsOptions {
    origin?: string | boolean | RegExp | Array<string | RegExp> | CorsOriginDelegate;
    credentials?: boolean;
  }

  function cors(options?: CorsOptions): RequestHandler;

  export default cors;
}
