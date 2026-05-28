import { Router } from "express";

import { authCodeCallback, signIn, signOut } from "#/auth/auth.handlers.js";

const router: Router = Router();

router.get("/signin", signIn);

router.get("/signout", signOut);

router.get("/code/callback", authCodeCallback);

export default router;
