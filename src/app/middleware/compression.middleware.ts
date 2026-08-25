import type { Request, RequestHandler, Response } from "express";

import compression from "compression";

/**
 * Middleware to handle response compression.
 * @returns {RequestHandler} - The compression middleware function.
 */
function compressionMiddleware(): RequestHandler {
  return compression({
    filter: (req: Request, res: Response): boolean => {
      if ("x-no-compression" in req.headers) {
        return false;
      }
      return compression.filter(req, res);
    },
  });
}

export { compressionMiddleware as compression };
