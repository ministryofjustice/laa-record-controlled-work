import { Router } from "express";

import { authCodeCallback, signIn, signOut } from "#/auth/auth.handlers.js";
import { METHOD_NOT_ALLOWED } from "#/lib/constants/http.js";

const router: Router = Router();

router.get("/signin", signIn);

router.get("/signout", (_req, res) => {
  res.set("Allow", "POST").sendStatus(METHOD_NOT_ALLOWED);
});

router.post("/signout", signOut);

router.get("/code/callback", authCodeCallback);

export default router;
