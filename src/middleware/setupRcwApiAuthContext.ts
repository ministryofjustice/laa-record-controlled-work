/* eslint-disable jsdoc/require-jsdoc -- middleware contract is clear from naming and types. */

import type { AccountInfo } from "@azure/msal-node";
import type { NextFunction, Request, Response } from "express";

import {
  RCW_API_AUTH_CONTEXT_STATE_KEY,
  type RcwApiAuthContext,
} from "#/api/rcw-api-auth-context.js";
import {
  NotAuthenticatedError,
  TokenRefreshError,
} from "#/auth/auth.errors.js";
import { EntraService } from "#/auth/entra.service.js";

export function setupRcwApiAuthContext(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { account } = req.session;
    if (account === undefined) {
      next(new NotAuthenticatedError());
      return;
    }

    const entra = EntraService.create({ sessionId: req.sessionID });
    const authContext = createRcwApiAuthContext(account, entra);

    res.locals[RCW_API_AUTH_CONTEXT_STATE_KEY] = authContext;
    next();
  };
}

function createRcwApiAuthContext(
  account: AccountInfo,
  entraService: EntraService,
): RcwApiAuthContext {
  let accessTokenPromise: Promise<string> | undefined;

  return {
    getBearerToken: async () => {
      accessTokenPromise ??= (async () => {
        const tokenResult = await entraService.acquireTokenSilent(account);
        if (tokenResult.error) {
          throw tokenResult.error;
        }

        const { accessToken } = tokenResult.value;
        if (accessToken === undefined) {
          throw new TokenRefreshError(
            new Error("MSAL did not return an access token"),
          );
        }

        return accessToken;
      })();

      return await accessTokenPromise;
    },
  };
}
