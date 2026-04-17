import {
  axiosMiddleware,
  createAuthLimiter,
  displayAsciiBanner,
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
import { initializeI18nextSync } from "#src/lib/index.js";
import chalk from "chalk";
import compression from "compression";
import type { Request, Response } from "express";
import express from "express";
import session from "express-session";
import morgan from "morgan";

const TRUST_FIRST_PROXY = 1;
const ENABLE_PLAYWRIGHT_TEST_SIGNIN =
  process.env.PLAYWRIGHT_TEST_SIGNIN === "true";

/**
 * Creates and configures an Express application.
 * Then starts the server listening on the configured port.
 *
 * @returns {Promise<import('express').Application>} The configured Express application
 */
const createApp = async (): Promise<express.Application> => {
  // Initialise i18next synchronously before setting up the app
  initializeI18nextSync();

  const app = express();

  // Set up common middleware for handling cookies, body parsing, etc.
  setupMiddlewares(app);

  app.use(axiosMiddleware);

  // Response compression setup
  app.use(
    compression({
      /**
       * Custom filter for compression.
       * Prevents compression if the 'x-no-compression' header is set in the request.
       *
       * @param {import('express').Request} req - The Express request object
       * @param {import('express').Response} res - The Express response object
       * @returns {boolean} True if compression should be applied, false otherwise
       */
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
  app.use(session(config.session));

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

  // Display ASCII Art banner
  displayAsciiBanner(config);

  // Starts the Express server on the specified port
  app.listen(config.app.port, () => {
    console.log(chalk.yellow(`Listening on port ${config.app.port}...`));
  });

  return app;
};

// Self-execute the app directly to allow app.js to be executed directly
void createApp();

// Export the createApp function for testing/import purposes
export default createApp;
