import { OK } from "#/lib/constants/httpStatus.js";
import { Router } from "express";

const router: Router = Router();

router.get("/signin", (req, res, next) => {
  req.session.isAuthenticated = true;
  req.session.account = {
    homeAccountId: "test-uid.test-tenant-id",
    environment: "login.microsoftonline.com",
    tenantId: "test-tenant-id",
    username: "testuser@example.com",
    localAccountId: "test-uid",
    name: "Test User",
    idTokenClaims: {},
  };
  req.session.save((err: Error | undefined | null) => {
    if (err) {
      next(err);
      return;
    }
    res.status(OK).send("Authenticated as Test User");
  });
});

export default router;
