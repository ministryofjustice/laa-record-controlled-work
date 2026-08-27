import { Router } from "express";

import { OK } from "#/app/enums/httpStatus.enum.js";

const router: Router = Router();

const FIRM_CODE = 12345;
const LAA_ACCOUNTS = ["R1XEVG", "VGHVEY", "3TVRNM"];

router.get("/signin", (req, res, next) => {
  req.session.isAuthenticated = true;
  req.session.account = {
    environment: "login.microsoftonline.com",
    homeAccountId: "test-uid.test-tenant-id",
    idToken: "test-id-token",
    idTokenClaims: {
      FIRM_CODE,
      LAA_ACCOUNTS,
    },
    localAccountId: "test-uid",
    name: "Test User",
    tenantId: "test-tenant-id",
    username: "testuser@example.com",
  };
  req.session.msal = {
    homeAccountId: "test-uid.test-tenant-id",
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
