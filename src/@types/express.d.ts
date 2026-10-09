import type session from "express-session";

import type { AuthFlowStore } from "#/auth/auth.flow-store.js";

export interface ExpressLocaleLoader {
  t: (key: string, options?: Record<string, unknown>) => string;
}

declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
      locale: ExpressLocaleLoader;
      session: Partial<session.SessionData> & session.Session;
      user?: AccountInfo;
    }
  }
}

declare module "express-serve-static-core" {
  interface Locals {
    authFlowStore?: AuthFlowStore;
    csrfToken?: string;
  }
}
