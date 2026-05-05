import { OK, INTERNAL_SERVER_ERROR } from "#/lib/constants/httpStatus.js";
import express from "express";
import type { NextFunction, Request, Response } from "express";


const router = express.Router()

// liveness and readiness probes for Helm deployments
router.get("/status", (_req: Request, res: Response): void => {
  res.status(OK).send("OK");
});

router.get("/health", (_req: Request, res: Response): void => {
  res.status(OK).send("Healthy");
});

router.get("/error", (_req: Request, res: Response): void => {
  // Simulate an error
  res
    .set("X-Error-Tag", "TEST_500_ALERT")
    .status(INTERNAL_SERVER_ERROR)
    .send("Internal Server Error");
});

export default router