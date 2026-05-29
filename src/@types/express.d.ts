import type session from "express-session";

import type { AxiosInstanceWrapper } from "#/services/axiosInstanceWrapper.js";

export interface ExpressLocaleLoader {
  t: (key: string, options?: Record<string, unknown>) => string;
}

declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
      axiosMiddleware: AxiosInstanceWrapper;
      locale: ExpressLocaleLoader;
      session: Partial<session.SessionData> & session.Session;
      user?: AccountInfo;
    }
  }
}

declare module "express-serve-static-core" {
  interface Locals {
    csrfToken?: string;
  }
}
