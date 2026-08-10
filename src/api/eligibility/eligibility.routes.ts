import type { Router } from "express";

import express from "express";

import type { SaveApplicationMeansDeps } from "#/api/eligibility/eligibility.service.js";

import { updateApplicationMeans } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import {
  createGetEligibilityHandler,
  createPutEligibilityHandler,
} from "#/api/eligibility/eligibility.handlers.js";

/**
 * Builds the eligibility router, accepting injected RCW API client deps for testing.
 * @param deps - RCW API client dependencies used by the save handler.
 * @returns Configured Express router.
 */
export function createEligibilityRouter(
  deps: SaveApplicationMeansDeps = { updateApplicationMeans },
): Router {
  const router = express.Router({ mergeParams: true });

  router.get("/", createGetEligibilityHandler());

  router.put("/", createPutEligibilityHandler(deps));

  return router;
}

export default createEligibilityRouter();
