import type { Router } from "express";

import express from "express";

import type {
  LoadEligibilityAssessmentDeps,
  SaveEligibilityAssessmentDeps,
} from "#/api/eligibility/eligibility.service.js";

import {
  getApplication,
  updateApplicationMeans,
} from "#/api/clients/rcw/schema/applications/applications.gen.js";
import {
  createGetEligibilityHandler,
  createPutEligibilityHandler,
} from "#/api/eligibility/eligibility.handlers.js";

export type EligibilityRouterDeps = LoadEligibilityAssessmentDeps &
  SaveEligibilityAssessmentDeps;

/**
 * Builds the eligibility router, accepting injected RCW API client deps for testing.
 * @param deps - RCW API client dependencies used by the GET/PUT handlers.
 * @returns Configured Express router.
 */
export function createEligibilityRouter(
  deps: EligibilityRouterDeps = { getApplication, updateApplicationMeans },
): Router {
  const router = express.Router({ mergeParams: true });

  router.get("/", createGetEligibilityHandler(deps));

  router.put("/", createPutEligibilityHandler(deps));

  return router;
}

export default createEligibilityRouter();
