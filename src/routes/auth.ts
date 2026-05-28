import { Router } from "express";

import { processAuthCodeCallback, signIn, signOut } from "#/handlers/auth.js";

const router: Router = Router();

router.get("/signin", signIn);

router.get("/signout", signOut);

router.get("/code/callback", processAuthCodeCallback);

export default router;
