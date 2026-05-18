import { Router } from "express";

import { OK } from "#/lib/constants/httpStatus.js";

const router: Router = Router();

router.get("/signin", (req, res, next) => {
  req.session.isAuthenticated = true;
  req.session.account = {
    environment: "login.microsoftonline.com",
    homeAccountId: "test-uid.test-tenant-id",
    idTokenClaims: {},
    localAccountId: "test-uid",
    name: "Test User",
    tenantId: "test-tenant-id",
    username: "testuser@example.com",
  };

  req.session.save((err: unknown) => {
    if (err !== undefined) {
      next(err);
      return;
    }
    res.status(OK).send("Authenticated as Test User");
  });
});

export default router;
