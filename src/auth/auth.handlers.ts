import type { NextFunction, Request, Response } from "express";

import { promisify } from "node:util";

import {
  MissingAuthCodeRequestError,
  StateMismatchError,
} from "#/auth/auth.errors.js";
import {
  isAllowedRelayTarget,
  parseRelayState,
  verifyRelayState,
} from "#/auth/auth.relay.js";
import {
  authCodeCallbackErrorSchema,
  authCodeCallbackSchema,
} from "#/auth/auth.types.js";
import { EntraService } from "#/auth/entra.service.js";
import { getMsalCacheKey } from "#/auth/msal.cache-key.js";
import config from "#/config.js";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#/lib/constants/http.js";
import { getRedisClient } from "#/lib/redis.js";
import { logger } from "#/logger.js";

const EMPTY_STRING_LENGTH = 0;

interface ValidatedCallbackState {
  authCodeRequest: NonNullable<Request["session"]["authCodeRequest"]>;
  data: { code: string; state: string };
  returnTo: string | undefined;
}

/**
 * Handles the Entra auth code callback, exchanging the code for tokens.
 * @param req - The Express request.
 * @param res - The Express response.
 * @param next - The Express next function.
 */
export async function authCodeCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const callbackState = getValidatedCallbackState(req, res);
    if (callbackState === undefined) {
      return;
    }

    const { authCodeRequest, data, returnTo } = callbackState;

    // establish a new session ID before token exchange so MSAL cache keys
    // align with the authenticated session ID.
    await regenerateSession(req);

    const entra = EntraService.create({ sessionId: req.sessionID });

    // exchange auth code for tokens and state
    const result = await entra.exchangeAuthCode(data.code, authCodeRequest);
    if (result.error) {
      res.status(UNAUTHORIZED).send(result.error.message);
      return;
    }

    const { account } = result.value;
    const homeAccountId = account?.homeAccountId.trim();
    if (
      homeAccountId === undefined ||
      homeAccountId.length === EMPTY_STRING_LENGTH
    ) {
      logger.error("Token exchange succeeded without an account homeAccountId");
      res.status(UNAUTHORIZED).send("Token acquisition failed");
      return;
    }

    Object.assign(req.session, {
      account,
      isAuthenticated: true,
      msal: {
        homeAccountId,
      },
    });
    res.redirect(returnTo ?? "/");
  } catch (error) {
    next(error);
  }
}

/**
 * Initiates the Entra sign-in flow by generating a PKCE auth code URL.
 * @param req - The Express request.
 * @param res - The Express response.
 * @param next - The Express next function.
 */
export async function signIn(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const returnToOverride = parseSafeReturnToOverride(req);
  if (returnToOverride !== undefined) {
    req.session.returnTo = returnToOverride;
  }

  try {
    const entra = EntraService.create({ sessionId: req.sessionID });
    const result = await entra.initiateAuthCodeFlow(req.session.returnTo, {
      callbackHostname: req.hostname,
    });
    if (result.error) {
      res.status(INTERNAL_SERVER_ERROR).send(result.error.message);
      return;
    }

    req.session.save((err: Error | undefined) => {
      if (err) {
        next(err);
        return;
      }

      const { authCodeUrl, ...authFlowState } = result.value;
      Object.assign(req.session, authFlowState);
      res.redirect(authCodeUrl);
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Destroys the session and redirects to the root.
 * @param req - The Express request.
 * @param res - The Express response.
 * @param next - The Express next function.
 */
export function signOut(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.sessionID;

  try {
    req.session.destroy((error: Error | null) => {
      if (error) {
        next(error);
        return;
      }

      void deleteMsalCache(sessionId)
        .then(() => {
          res.clearCookie(config.session.name);
          res.redirect("/");
        })
        .catch(next);
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes MSAL session cache from Redis when enabled.
 * @param sessionId - The express-session ID.
 */
async function deleteMsalCache(sessionId: string): Promise<void> {
  if (!config.redis.enabled) return;

  const key = getMsalCacheKey(sessionId);
  await getRedisClient().del(key);
}

/**
 * Validates callback payload, relay behavior, and session flow state.
 * @param req - Express request.
 * @param res - Express response.
 * @returns Callback state when valid; otherwise undefined after response is handled.
 */
function getValidatedCallbackState(
  req: Request,
  res: Response,
): undefined | ValidatedCallbackState {
  const parsed = authCodeCallbackSchema.safeParse(req.query);
  if (!parsed.success) {
    const parsedError = authCodeCallbackErrorSchema.safeParse(req.query);
    if (parsedError.success) {
      const description = parsedError.data.error_description?.trim();
      const errorMessage = description ?? parsedError.data.error;
      logger.warn("Entra auth callback returned an error", {
        entraError: parsedError.data.error,
        entraErrorDescription: description,
      });
      res.status(BAD_REQUEST).send(`Entra sign-in failed: ${errorMessage}`);
      return undefined;
    }

    res.status(BAD_REQUEST).send("Invalid redirect payload");
    return undefined;
  }

  // exit early if callback is relayed to ephemeral env
  if (handleRelay(parsed.data, req, res)) {
    return undefined;
  }

  // verify that session contains correct flow state
  const { authCodeRequest, authState, returnTo } = req.session;
  if (authCodeRequest === undefined) {
    res.status(BAD_REQUEST).send(new MissingAuthCodeRequestError().message);
    return undefined;
  }

  if (authState === undefined || parsed.data.state !== authState) {
    res.status(BAD_REQUEST).send(new StateMismatchError().message);
    return undefined;
  }

  return {
    authCodeRequest,
    data: parsed.data,
    returnTo,
  };
}

/**
 * If the state encodes a signed relay target for a different host, validates
 * the signature and redirects the callback to that ephemeral environment.
 * @param data - The parsed auth code response.
 * @param data.code - The authorisation code from Entra.
 * @param data.state - The OAuth state parameter.
 * @param req - The Express request.
 * @param res - The Express response.
 * @returns true if the response was handled (redirected or rejected), false if
 *          the callback should be processed locally.
 */
function handleRelay(
  data: { code: string; state: string },
  req: Request,
  res: Response,
): boolean {
  const relayState = parseRelayState(data.state);
  if (relayState === null) return false;

  const { target } = relayState;
  if (
    !verifyRelayState(relayState, config.session.secret) ||
    !isAllowedRelayTarget(target)
  ) {
    res.status(BAD_REQUEST).send("Invalid relay target");
    return true;
  }

  const targetUrl = new URL(target);
  if (targetUrl.hostname === req.hostname) return false;

  targetUrl.pathname = "/auth/code/callback";
  targetUrl.searchParams.set("code", data.code);
  targetUrl.searchParams.set("state", data.state);

  logger.info("Relaying auth callback", { targetHostname: targetUrl.hostname });
  res.set("Cache-Control", "no-store");
  res.redirect(targetUrl.toString());
  return true;
}

/**
 * Validates that a redirect target is a same-origin app-relative path.
 * @param path - Candidate redirect path.
 * @returns `true` when the path is safe for local redirect usage.
 */
function isRelativePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

/**
 * Extracts a safe app-relative `returnTo` path from the signin query string.
 * @param req - The Express request.
 * @returns A validated relative path when present, otherwise `undefined`.
 */
function parseSafeReturnToOverride(req: Request): string | undefined {
  const { returnTo } = req.query;
  if (typeof returnTo !== "string") return undefined;

  const normalizedReturnTo = returnTo.trim();
  return isRelativePath(normalizedReturnTo) ? normalizedReturnTo : undefined;
}

/**
 * Rotates the current express-session ID and replaces `req.session`.
 * @param req - The Express request.
 */
async function regenerateSession(req: Request): Promise<void> {
  const regenerate = promisify(
    (callback: (error?: Error | null) => void): void => {
      req.session.regenerate(callback);
    },
  );
  await regenerate();
}
