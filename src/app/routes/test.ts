import { Router } from "express";

import {
  FIRM_NAME,
  getTestSessionAccount,
  LAA_ACCOUNT,
} from "#/auth/actions/getTestSessionAccount.action.js";
import { OK } from "#/lib/constants/http.js";

const router: Router = Router();

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

export default router;
