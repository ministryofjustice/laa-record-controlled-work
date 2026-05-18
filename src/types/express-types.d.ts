import type session from "express-session";

import type { AxiosInstanceWrapper } from "./axios-instance-wrapper.js";

/**
 * Express locale loader interface for backwards compatibility
 */
export interface ExpressLocaleLoader {
  t: (key: string, options?: Record<string, unknown>) => string;
}

declare global {
  namespace Express {
    interface Request {
      // INFO: extend Express Request type for MSAL integration of user and tokens and allowing undefined in session
      accessToken?: string;
      axiosMiddleware: AxiosInstanceWrapper;

      locale: ExpressLocaleLoader;
      session: Partial<session.SessionData> & session.Session;
      user?: AccountInfo;
    }
  }
}
