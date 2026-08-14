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

import type { CreateRedisStore, GetRedisClient } from "#/lib/redis.js";

import { getAllProviderOffices } from "#/api/clients/pda/schema/provider-firms-endpoints/provider-firms-endpoints.gen.js";
import {
  createApplication,
  getApplication,
  getApplications,
} from "#/api/clients/rcw/schema/applications/applications.gen.js";
import eligibilityRouter from "#/api/eligibility/eligibility.routes.js";
import authRouter from "#/auth/auth.routes.js";
import config from "#/config.js";
import { autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import createApplicationJourney from "#/journeys/create-application/create-application.index.js";
import declaration from "#/journeys/declaration/declaration.index.js";
import { editApplicationPackage } from "#/journeys/edit-application/editApplication.package.js";
import evidence from "#/journeys/evidence/evidence.index.js";
import { selectOfficePackage } from "#/journeys/select-office/select-office.journey.js";
import { yourCasesPackage } from "#/journeys/your-cases/your-cases.journey.js";
import * as redis from "#/lib/redis.js";
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

interface Dependencies {
  createRedisStore?: CreateRedisStore;
  getRedisClient?: GetRedisClient;
}

/**
 * Creates and configures an Express application.
 * Server startup is handled separately in src/server.ts.
 *
 * @param dependencies injected dependencies
 * @returns {Promise<import('express').Application>} The configured Express application
 */
const createApp = async (
  dependencies: Dependencies = {},
): Promise<express.Application> => {
  const {
    createRedisStore = redis.createRedisStore,
    getRedisClient = redis.getRedisClient,
  } = dependencies;

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
    .registerPackage(yourCasesPackage, { getApplications })
    .registerPackage(selectOfficePackage, { getAllProviderOffices })
    .registerPackage(editApplicationPackage, { getApplication })
    .registerPackage(createApplicationJourney, { createApplication })
    .registerPackage(evidence)
    .registerPackage(declaration);

  // Set up rate limiting
  setupRateLimit(app, config);

  // Set up application-specific configurations
  setupConfig(app);

  // Set up request logging based on environment
  setupRequestLogging(app);

  // Setup express-session using redis
  app.use(
    session(await createSession(config, getRedisClient, createRedisStore)),
  );

  app.use(
    "/api/applications/:applicationId/eligibility",
    requireAuth,
    eligibilityRouter,
  );

  setupCsrf(app);

  // Playwright-only route: sets an authenticated session without going through Entra.
  if (
    process.env.PLAYWRIGHT_TEST_SIGNIN === "true" &&
    process.env.NODE_ENV === "test"
  ) {
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

  const forgeRouter = createExpressRouter(forge, { nunjucksEnv });

  app.get("/cases/:id", (req, res, next) => {
    const { id } = req.params;

    if (
      id === "new" ||
      id === "evidence" ||
      id === "recorded" ||
      id === "ineligible"
    ) {
      next();
      return;
    }

    res.redirect(`/cases/${id}/task-list`);
  });

  app.use("/", forgeRouter);

  return app;
};

export default createApp;
