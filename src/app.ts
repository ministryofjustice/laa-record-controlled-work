import type { Request, Response } from "express";

import { Forge } from "@ministryofjustice/hmpps-forge/core";
import {
  createExpressRouter,
  nunjucksFunctions,
} from "@ministryofjustice/hmpps-forge/express-nunjucks";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { mojComponents } from "@ministryofjustice/hmpps-forge/moj-components";
import compression from "compression";
import express from "express";
import session from "express-session";

import { getApplications } from "#/api/client/schema/applications/applications.gen.js";
import authRouter from "#/auth/auth.routes.js";
import config from "#/config.js";
import { autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import createApplication from "#/journeys/create-application/index.js";
import yourCases from "#/journeys/your-cases/index.js";
import { createSession } from "#/lib/session.js";
import { requireAuth } from "#/middleware/requireAuth.js";
import { setupConfig } from "#/middleware/setupConfigs.js";
import { setupCsrf } from "#/middleware/setupCsrf.js";
import { helmetSetup as setupHelmet } from "#/middleware/setupHelmet.js";
import { setupLocaleMiddleware } from "#/middleware/setupLocale.js";
import { setupNunjucks } from "#/middleware/setupNunjucks.js";
import {
  createAuthLimiter,
  setupRateLimit,
} from "#/middleware/setupRateLimit.js";
import { setupRequestLogging } from "#/middleware/setupRequestLogging.js";
import { standardMiddleware } from "#/middleware/standardMiddleware.js";
import healthRouter from "#/routes/health.js";
import indexRouter from "#/routes/index.js";
import testRouter from "#/routes/test.js";

const TRUST_FIRST_PROXY = 1;
const ENABLE_PLAYWRIGHT_TEST_SIGNIN =
  process.env.PLAYWRIGHT_TEST_SIGNIN === "true";

/**
 * Creates and configures an Express application.
 * Server startup is handled separately in src/server.ts.
 *
 * @returns {Promise<import('express').Application>} The configured Express application
 */
const createApp = async (): Promise<express.Application> => {
  const app = express();

  app.use("/", healthRouter);

  // Set up common middleware for handling cookies, body parsing, etc.
  standardMiddleware(app);

  // Response compression setup
  app.use(
    compression({
      filter: (req: Request, res: Response): boolean => {
        if ("x-no-compression" in req.headers) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // Set up security headers
  setupHelmet(app);

  // Reducing fingerprinting by removing the 'x-powered-by' header
  app.disable("x-powered-by");

  // Set up cookie security for sessions
  app.set("trust proxy", TRUST_FIRST_PROXY);

  // Set up locale middleware for internationalization
  app.use(setupLocaleMiddleware);

  // Set up Nunjucks as the template engine and forge
  const nunjucksEnv = setupNunjucks(app);
  const forge = new Forge({});

  forge
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents(mojComponents)
    .registerGlobalComponents([autocomplete])
    .registerGlobalFunctions(nunjucksFunctions)
    .registerPackage(yourCases, { getApplications })
    .registerPackage(createApplication);

  // Set up rate limiting
  setupRateLimit(app, config);

  // Set up application-specific configurations
  setupConfig(app);

  // Set up request logging based on environment
  setupRequestLogging(app);

  // Setup express-session using redis
  app.use(session(await createSession(config)));

  setupCsrf(app);

  // Playwright-only route: sets an authenticated session without going through Entra.
  if (ENABLE_PLAYWRIGHT_TEST_SIGNIN && process.env.NODE_ENV === "test") {
    app.use("/test", testRouter);
  }

  app.use("/auth", createAuthLimiter(config), authRouter);
  app.use(requireAuth);
  app.use("/", indexRouter);

  // Enable live-reload middleware in development mode
  if (process.env.NODE_ENV === "development") {
    const { default: livereload } = await import("connect-livereload");
    app.use(livereload());
  }

  // set up forge router for handling routes and use express.urlencoded middleware for parsing URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));
  const forgeRouter = createExpressRouter(forge, { nunjucksEnv });

  app.use("/", forgeRouter);

  return app;
};

export default createApp;
