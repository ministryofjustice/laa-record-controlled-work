import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import session from "express-session";

import type { CreateRedisStore, GetRedisClient } from "#/lib/redis.js";

import { ENV } from "#/app/env.enum.js";
import { compression } from "#/app/middleware/compression.middleware.js";
import { cspNonce } from "#/app/middleware/cspNonce.middleware.js";
import { helmet } from "#/app/middleware/helmet.middleware.js";
import { locale } from "#/app/middleware/locale.middleware.js";
import { isEnv } from "#/app/utils/isEnv.js";
import config from "#/config.js";
import { createSession } from "#/lib/session.js";
import { setupConfig } from "#/middleware/setupConfigs.js";
import { setupCsrf } from "#/middleware/setupCsrf.js";
import { setupRateLimit } from "#/middleware/setupRateLimit.js";
import { setupRequestLogging } from "#/middleware/setupRequestLogging.js";

interface Dependencies {
  createRedisStore?: CreateRedisStore;
  getRedisClient?: GetRedisClient;
}

/**
 * Setup middleware for the Express app.
 * @param app  The Express application instance.
 * @param dependencies  Dependencies passed into the application.
 * @returns {void}
 */
export async function initMiddleware(
  app: Express,
  dependencies: Dependencies,
): Promise<void> {
  const { createRedisStore, getRedisClient } = dependencies;

  // Parse cookies and adds them to `req.cookies`.
  app.use(cookieParser());

  // Serve static files from the specified public directory.
  app.use(express.static(config.app.paths.static));

  // Parse URL-encoded bodies. Note that we require extended parsing to support Forge form submissions.
  app.use(express.urlencoded({ extended: true }));

  // Parse JSON request bodies.
  app.use(express.json());

  // Handle request/response compression.
  app.use(compression());

  // Setup CSP nonce.
  app.use(cspNonce());

  // Setup Helmet for security headers.
  app.use(helmet());

  // Setup express-session using Redis as datastore.
  app.use(
    session(await createSession(config, getRedisClient, createRedisStore)),
  );

  // Setup internationalization.
  app.use(locale());

  // Set up rate limiting
  // TODO Refactor to pure middleware, rather than a setup method.
  setupRateLimit(app, config);

  // Set up application-specific configurations
  // TODO Refactor to pure middleware, rather than a setup method.
  setupConfig(app);

  // Set up request logging based on environment
  // TODO Refactor to pure middleware, rather than a setup method.
  setupRequestLogging(app);

  // Set up CSRF protection.
  // TODO Refactor to pure middleware, rather than a setup method.
  setupCsrf(app);

  // Auth.
  // app.use(requireAuth);

  // Enable live-reload middleware in development environments.
  if (isEnv(ENV.DEV)) {
    const { default: livereload } = await import("connect-livereload");
    app.use(livereload());
  }
}
