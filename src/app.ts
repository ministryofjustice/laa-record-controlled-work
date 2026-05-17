import config from "#/config.js";

import { helmetSetup as setupHelmet } from "#/middleware/setupHelmet.js";
import { setupNunjucks } from "#/middleware/setupNunjucks.js";
import {
  setupRateLimit,
  createAuthLimiter,
} from "#/middleware/setupRateLimit.js";
import { initializeI18nextSync } from "#/lib/i18nLoader.js";
import { createSession } from "#/lib/session.js";
import { axiosMiddleware } from "#/middleware/apiMiddleware.js";
import { standardMiddleware } from "#/middleware/standardMiddleware.js";
import { requireAuth } from "#/middleware/requireAuth.js";
import { setupConfig } from "#/middleware/setupConfigs.js";
import { setupCsrf } from "#/middleware/setupCsrf.js";
import { setupLocaleMiddleware } from "#/middleware/setupLocale.js";
import authRouter from "#/routes/auth.js";
import indexRouter from "#/routes/index.js";
import testRouter from "#/routes/test.js";
import healthRouter from "#/routes/health.js";

import compression from "compression";
import type { Request, Response } from "express";
import express from "express";
import morgan from "morgan";
import session from "express-session";

/**
 * Creates and configures an Express application.
 * Server startup is handled separately in src/server.ts.
 *
 * @returns {Promise<import('express').Application>} The configured Express application
 */
const createApp = async (): Promise<express.Application> => {
  const TRUST_FIRST_PROXY = 1;
  const ENABLE_PLAYWRIGHT_TEST_SIGNIN =
    process.env.PLAYWRIGHT_TEST_SIGNIN === "true";
  // Initialise i18next synchronously before setting up the app
  initializeI18nextSync();

  const app = express();

  app.use("/", healthRouter);

  // Set up common middleware for handling cookies, body parsing, etc.
  standardMiddleware(app);

  app.use(axiosMiddleware);

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

  app.use(session(await createSession(config)));

  // Set up locale middleware for internationalization
  app.use(setupLocaleMiddleware);

  // Set up Nunjucks as the template engine
  setupNunjucks(app);

  // Set up rate limiting
  setupRateLimit(app, config);

  // Set up application-specific configurations
  setupConfig(app);

  // Set up request logging based on environment
  if (process.env.NODE_ENV === "production") {
    // Use combined format for production (more structured, less verbose)
    app.use(morgan("combined"));
  } else {
    // Use dev format for development (colored, more readable)
    app.use(morgan("dev"));
  }

  // Setup express-session using redis
  app.use(session(await createSession(config)));

  setupCsrf(app);

  // Playwright-only route: sets an authenticated session without going through Entra.
  if (ENABLE_PLAYWRIGHT_TEST_SIGNIN && process.env.NODE_ENV === "test") {
    app.use("/test", testRouter);
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

  return app;
};

export default createApp;
