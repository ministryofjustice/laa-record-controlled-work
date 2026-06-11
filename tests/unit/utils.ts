import express, { type Application, type Request } from "express";
import session from "express-session";

import authRouter from "#/auth/auth.routes.js";
import { INTERNAL_SERVER_ERROR } from "#/lib/constants/http.js";
import { setupCsrf } from "#/middleware/setupCsrf.js";

/**
 * Creates a mock app for test auth routes against
 * @param options - optional config
 * @param options.seedSession - whether to auto-seed session state on callback requests (default true)
 * @returns a sandbox express app
 */
export function createMockApp({ seedSession = true } = {}): Application {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ resave: false, saveUninitialized: true, secret: "test" }));
  setupCsrf(app);

  // Exposes a CSRF token so tests can make valid POST requests
  app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken?.() });
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

  app.use("/auth", authRouter);

  // Catches errors passed to next() so tests can assert on status/message
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(INTERNAL_SERVER_ERROR).json({ message: err.message });
    },
  );
  return app;
}
