import type { Request, Response } from "express";

import express from "express";

import { OK } from "#/lib/constants/http.js";

const router = express.Router();

router.get("/load", (_req: Request, res: Response): void => {
  res.sendStatus(OK);
});

export default router;
