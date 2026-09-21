import type { Router } from "express";

import express from "express";

import type { LoadApplicationForExportDeps } from "#/export/export.types.js";

import { getApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import { createGetExportHandler } from "#/export/export.handlers.js";

export type ExportRouterDeps = LoadApplicationForExportDeps;

/**
 * Builds the export router with injectable API dependencies.
 * @param deps - The RCW API client dependencies.
 * @returns The configured export router.
 */
export function createExportRouter(
  deps: ExportRouterDeps = { getApplication },
): Router {
  const router = express.Router({ mergeParams: true });

  router.get("/", createGetExportHandler(deps));

  return router;
}

export default createExportRouter();
