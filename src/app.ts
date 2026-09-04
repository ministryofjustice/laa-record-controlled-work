import express from "express";

import type { CreateRedisStore, GetRedisClient } from "#/lib/redis.js";

import { initForge } from "#/app/forge.js";
import { initMiddleware } from "#/app/middleware.js";
import { handleGlobalErrors } from "#/app/middleware/handleGlobalErrors.middleware.js";
import { logGlobalErrors } from "#/app/middleware/logGlobalError.middleware.js";
import { initRoutes } from "#/app/routes.js";
import { initSecurity } from "#/app/security.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";

interface Dependencies {
  createRedisStore?: CreateRedisStore;
  getRedisClient?: GetRedisClient;
}

/**
 * Creates and configures an Express application.
 * Server startup is handled separately in src/server.ts.
 *
 * @param dependencies  Injected dependencies.
 * @returns {Promise<import('express').Application>}  The configured Express application.
 */
const createApp = async (
  dependencies: Dependencies = {},
): Promise<express.Application> => {
  const app = express();

  initSecurity(app);
  await initMiddleware(app, dependencies);
  initRoutes(app);
  initForge(app);

  // If the route wasn't handled by any other route or middleware, assume a 404. This must be registered after all other routes and *most* middleware.
  app.use((req, res, next) => {
    res.status(HTTP_STATUS.NOT_FOUND).render("main/error-404");
    next();
  });

  // Handle errors. This must be the last thing registered, after all other middleware and routes.
  app.use(logGlobalErrors());
  app.use(handleGlobalErrors());

  return app;
};

export default createApp;
