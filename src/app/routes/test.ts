import { Router } from "express";

import {
  FIRM_NAME,
  getTestSessionAccount,
  LAA_ACCOUNT,
} from "#/auth/actions/getTestSessionAccount.action.js";
import { OK } from "#/lib/constants/http.js";

const router: Router = Router();

/**
 * Mimic a sign-in for testing purposes. This route MUST NOT be available in production.
 */
router.get("/signin", (req, res, next) => {
  req.session.isAuthenticated = true;
  req.session.account = getTestSessionAccount();
  req.session.selectedOffice = {
    address: "123 Test Street",
    code: LAA_ACCOUNT,
    firmName: FIRM_NAME,
  };
  req.session.msal = {
    homeAccountId: "test.user@example.com",
  };

  req.session.save((err: unknown) => {
    if (err !== undefined) {
      next(err);
      return;
    }
    res.status(OK).send("Authenticated as Test User");
  });
});

/**
 * Mimic selecting an office for testing purposes. This route MUST NOT be available in production.
 */
router.get("/select-office", (req, res, next) => {
  if (!req.session.account?.idTokenClaims) {
    throw new Error("No account found.");
  }

  req.session.account.idTokenClaims.LAA_ACCOUNTS = ["VGHVEY"];
  req.session.selectedOffice = {
    address: "456 Another Street",
    code: "VGHVEY",
    firmName: FIRM_NAME,
  };

  req.session.save((err: unknown) => {
    if (err !== undefined) {
      next(err);
      return;
    }
    res.status(OK).send("Selected office changed to VGHVEY");
  });
});

export default router;
