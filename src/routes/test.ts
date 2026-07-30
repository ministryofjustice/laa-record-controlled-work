import { Router } from "express";

import { OK } from "#/lib/constants/http.js";

const router: Router = Router();

const FIRM_CODE = 12345;

router.get("/signin", (req, res, next) => {
  req.session.isAuthenticated = true;
  req.session.account = {
    environment: "login.microsoftonline.com",
    homeAccountId: "test-uid.test-tenant-id",
    idToken: "test-id-token",
    idTokenClaims: {
      FIRM_CODE,
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

router.get("/set-office", (req, res, next) => {
  req.session.selectedOffice = {
    address: "1 Test Street, Test City",
    code: "1T001X",
    officeName: "Test Office",
    postCode: "T1 1TT",
  };

  req.session.save((err: unknown) => {
    if (err !== undefined) {
      next(err);
      return;
    }
    res.status(OK).send("Office set in session");
  });
});

export default router;
