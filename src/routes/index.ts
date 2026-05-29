import type { Request, Response } from "express";

import express from "express";

const router = express.Router();

router.get("/", (req: Request, res: Response): void => {
  res.render("main/index");
});

router.get("/landing", (req: Request, res: Response): void => {
  res.render("main/landing");
});

export default router;
