import { OK } from "#/lib/constants/httpStatus.js";
import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

// liveness and readiness probes for Helm deployments
router.get("/status", (_req: Request, res: Response): void => {
  res.status(OK).send("OK");
});

router.get("/health", (_req: Request, res: Response): void => {
  res.status(OK).send("Healthy");
});

export default router;
