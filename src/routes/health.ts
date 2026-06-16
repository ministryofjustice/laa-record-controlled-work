import type { Request, Response } from "express";

import express from "express";

import { OK } from "#/lib/constants/http.js";

const router = express.Router();

// liveness and readiness probes for Helm deployments
router.get("/status", (_req: Request, res: Response): void => {
  res.status(OK).send("OK");
});

router.get("/health", (_req: Request, res: Response): void => {
  res.status(OK).send("Healthy");
});

export default router;
