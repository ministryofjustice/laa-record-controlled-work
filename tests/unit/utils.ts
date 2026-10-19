import express, { type Application, type Router } from "express";
import session from "express-session";

import { addCsrfToLocals, csrf } from "#/app/middleware/csrf.middleware.js";
import authRouter from "#/auth/auth.routes.js";
import config from "#/config.js";
import { INTERNAL_SERVER_ERROR } from "#/lib/constants/http.js";

/**
 * Creates a mock Express app for testing routes against.
 * @param options - optional config
 * @param options.router - router to mount instead of the default auth router
 * @param options.mountPath - path to mount `router` at (default "/auth")
 * @param options.sessionStore - session store for testing persistence behavior
 * @param options.useCsrf - whether to apply CSRF protection; match production for the mounted router (default true)
 * @returns a sandbox express app
 */
export function createMockApp({
  mountPath = "/auth",
  router = authRouter,
  sessionStore,
  useCsrf = true,
}: {
  mountPath?: string;
  router?: Router;
  sessionStore?: session.Store;
  useCsrf?: boolean;
} = {}): Application {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      ...config.session,
      ...(sessionStore === undefined ? {} : { store: sessionStore }),
    }),
  );

  if (useCsrf) {
    app.use(csrf);
    app.use(addCsrfToLocals);

    // Exposes a CSRF token so tests can make valid POST requests
    app.get("/csrf-token", (req, res) => {
      res.json({ csrfToken: req.csrfToken?.() });
    });
  }

  app.get("/test/session", (req, res) => {
    res.json(req.session);
  });

  app.use(mountPath, router);

  // Catches errors passed to next() so tests can assert on status/message.
  // Respects err.status/statusCode (e.g. body-parser JSON syntax errors set 400)
  // to match Express's default behaviour, since production has no custom handler.
  app.use(
    (
      err: Error & { status?: number; statusCode?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res
        .status(err.status ?? err.statusCode ?? INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    },
  );
  return app;
}
