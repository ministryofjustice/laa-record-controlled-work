import { Router } from "express";

import {
  processAuthCodeCallback,
  signIn,
  signOut,
} from "#/controllers/auth.js";

const router: Router = Router();

router.get("/signin", signIn);

router.post("/signout", signOut);

router.get("/code/callback", processAuthCodeCallback);

export default router;
