import express from "express";

import type { CreateRedisStore, GetRedisClient } from "#/lib/redis.js";

import { initForge } from "#/app/forge.js";
import { initMiddleware } from "#/app/middleware.js";
import { initRoutes } from "#/app/routes.js";
import { initSecurity } from "#/app/security.js";

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

  return app;
};

export default createApp;
