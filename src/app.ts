import {
  axiosMiddleware,
  createAuthLimiter,
  helmetSetup,
  nunjucksSetup,
  rateLimitSetUp,
} from "#bootstrap/index.js";
import config from "#config.js";
import {
  setupConfig,
  setupCsrf,
  setupLocaleMiddleware,
  setupMiddlewares,
} from "#middleware/index.js";
import { requireAuth } from "#middleware/requireAuth.js";
import authRouter from "#src/routes/auth.js";
import indexRouter from "#src/routes/index.js";

import compression from "compression";
import type { Request, Response } from "express";
import express from "express";
import session from "express-session";
import morgan from "morgan";
import SessionService from "./services/sessionService.js";
import { initializeI18nextSync } from "./lib/i18nLoader.js";

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
  // Initialise i18next synchronously before setting up the app
  initializeI18nextSync();

  const app = express();

  const sessionService = SessionService.create();
  const sessionConfig = await sessionService.getSessionConfig(
    config.expressSession,
  );
  // Set up common middleware for handling cookies, body parsing, etc.
  setupMiddlewares(app);

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
  helmetSetup(app);

  // Reducing fingerprinting by removing the 'x-powered-by' header
  app.disable("x-powered-by");

  // Set up cookie security for sessions
  app.set("trust proxy", TRUST_FIRST_PROXY);
  app.use(session(sessionConfig));

  // Set up locale middleware for internationalization
  app.use(setupLocaleMiddleware);

  // Set up Nunjucks as the template engine
  nunjucksSetup(app);

  // Set up rate limiting
  rateLimitSetUp(app, config);

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

  // CSRF protection applied globally; /auth/code/callback is excluded via
  // skipCsrfProtection (PKCE state provides the equivalent protection for that endpoint).
  setupCsrf(app);

  // Playwright-only route: sets an authenticated session without going through Entra.
  if (ENABLE_PLAYWRIGHT_TEST_SIGNIN && process.env.NODE_ENV === "test") {
    app.get("/test/signin", (req, res) => {
      req.session.isAuthenticated = true;
      res.redirect("/");
    });
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
