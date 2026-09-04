import express from "express";

import { HTTP_STATUS } from "#/lib/constants/http.js";

const router = express.Router({ mergeParams: true });

router.get("/404", (req, res) => {
  res.status(HTTP_STATUS.BAD_REQUEST).render("main/error-404");
});

router.get("/500", (req, res) => {
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).render("main/error-500");
});

export { router as errorRouter };
