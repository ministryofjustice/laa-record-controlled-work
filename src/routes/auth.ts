import {
  processAuthCodeCallback,
  signIn,
  signOut,
} from "#/controllers/auth.js";
import { Router } from "express";

const router: Router = Router();

router.get("/signin", signIn);

router.post("/signout", signOut);

router.post("/code/callback", processAuthCodeCallback);

export default router;
