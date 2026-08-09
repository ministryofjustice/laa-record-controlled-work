import express, { type Application, type Request, type Router } from "express";
import session from "express-session";

import authRouter from "#/auth/auth.routes.js";
import { INTERNAL_SERVER_ERROR } from "#/lib/constants/http.js";
import { setupCsrf } from "#/middleware/setupCsrf.js";

/**
 * Creates a mock Express app for testing routes against.
 * @param options - optional config
 * @param options.seedSession - whether to auto-seed session state on callback requests (default true)
 * @param options.router - router to mount instead of the default auth router
 * @param options.mountPath - path to mount `router` at (default "/auth")
 * @param options.useCsrf - whether to apply CSRF protection; match production for the mounted router (default true)
 * @returns a sandbox express app
 */
export function createMockApp({
  mountPath = "/auth",
  router = authRouter,
  seedSession = true,
  useCsrf = true,
}: {
  mountPath?: string;
  router?: Router;
  seedSession?: boolean;
  useCsrf?: boolean;
} = {}): Application {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ resave: false, saveUninitialized: true, secret: "test" }));

  if (useCsrf) {
    setupCsrf(app);

    // Exposes a CSRF token so tests can make valid POST requests
    app.get("/csrf-token", (req, res) => {
      res.json({ csrfToken: req.csrfToken?.() });
    });
  }

  app.get("/test/session", (req, res) => {
    res.json(req.session);
  });

  // Seed auth flow state on the session so callback handler guards pass.
  // The state value must match the query param sent in the test request.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- only need to define query param
  type CallbackRequest = Request<{}, {}, {}, { state: string }>;
  if (seedSession) {
    app.use("/auth/code/callback", (req: CallbackRequest, res, next) => {
      const { state } = req.query;
      if (state) {
        req.session.authState = state;
        req.session.authCodeRequest = {
          code: "",
          codeVerifier: "",
          redirectUri: "",
          scopes: [],
        };
        req.session.returnTo = "/";
      }
      next();
    });
  }

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
