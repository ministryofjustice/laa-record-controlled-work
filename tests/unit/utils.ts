import { setupCsrf } from "#/middleware/setupCsrf.js";
import express, { type Application } from "express";
import session from "express-session";
import authRouter from "#/routes/auth.js";
import { INTERNAL_SERVER_ERROR } from "#/lib/constants/httpStatus.js";

/**
 * Creates a mock app for test auth routes against
 * @returns a sandbox express app
 */
export function createMockApp(): Application {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
  setupCsrf(app);
  // Exposes a CSRF token so tests can make valid POST requests
  app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken?.() });
  });
  app.use("/auth", authRouter);
  // // Catches errors passed to next() so tests can assert on status/message
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
