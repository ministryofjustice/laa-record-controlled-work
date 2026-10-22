import type { Express } from "express";

import { OK } from "#/lib/constants/http.js";

/**
 * Registers health checks before session middleware.
 * @param app - Express application.
 */
export function setupHealthChecks(app: Express): void {
  app.get("/status", (_req, res) => {
    res.status(OK).send("OK");
  });

  app.get("/health", (_req, res) => {
    res.status(OK).send("Healthy");
  });
}
