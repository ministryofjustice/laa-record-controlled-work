import type { Request, Response, Router } from "express";

import express from "express";

import type { SaveApplicationMeansDeps } from "#/api/eligibility/eligibility.service.js";

import { updateApplicationMeans } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import { createSaveHandler } from "#/eligibility/eligibility.handlers.js";

/**
 * Builds the eligibility router, accepting injected RCW API client deps for testing.
 * @param deps - RCW API client dependencies used by the save handler.
 * @returns Configured Express router.
 */
export function createEligibilityRouter(
  deps: SaveApplicationMeansDeps = { updateApplicationMeans },
): Router {
  const router = express.Router();

  router.get("/load", (_req: Request, res: Response): void => {
    res.json({ return_url: "http://localhost:8080" });
  });

  router.post("/save", createSaveHandler(deps));

  return router;
}

export default createEligibilityRouter();
