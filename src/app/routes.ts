import type { Express, Request, Response } from "express";

import eligibilityRouter from "#/api/eligibility/eligibility.routes.js";
import { OK } from "#/app/enums/httpStatus.enum.js";
import authRouter from "#/auth/auth.routes.js";
import config from "#/config.js";
import { createAuthLimiter } from "#/middleware/setupRateLimit.js";

import { requireAuth } from "./middleware/requireAuth.middleware.js";
import testRoutes from "./routes/test.js";

export const initRoutes = (app: Express): void => {
  // Root endpoint - serves the main page of the application.
  app.get("/", requireAuth, (req: Request, res: Response): void => {
    res.render("main/index");
  });

  // Health endpoints - used for liveness and readiness probes.
  app.get("/status", (req: Request, res: Response): void => {
    res.status(OK).send("OK");
  });

  app.get("/health", (req: Request, res: Response): void => {
    res.status(OK).send("Healthy");
  });

  // Auth.
  app.use("/auth", createAuthLimiter(config), authRouter);

  // CCQ
  app.use(
    "/api/applications/:applicationId/eligibility",
    requireAuth,
    eligibilityRouter,
  );

  // Forge: Prioritise `/cases/(evidence|ineligible|new|recorded)` over `/cases/:applicationId`
  // and redirect case URL's to the task list.
  app.get("/cases/:applicationId", requireAuth, (req, res, next) => {
    let { applicationId } = req.params;
    const priority = ["evidence", "ineligible", "new", "recorded"];

    if (Array.isArray(applicationId)) {
      [applicationId] = applicationId;
    }

    if (priority.includes(applicationId)) {
      next();
      return;
    }

    res.redirect(`/cases/${applicationId}/task-list`);
  });

  // Test only routes.
  if (
    process.env.PLAYWRIGHT_TEST_SIGNIN === "true" &&
    process.env.NODE_ENV === "test"
  ) {
    app.use("/test", testRoutes);
  }
};
