import type { NextFunction, Request, Response } from "express";

import {
  MissingAuthCodeRequestError,
  StateMismatchError,
} from "#/auth/auth.errors.js";
import {
  isAllowedRelayTarget,
  parseRelayState,
  verifyRelayState,
} from "#/auth/auth.relay.js";
import { authCodeCallbackSchema } from "#/auth/auth.types.js";
import { EntraService } from "#/auth/entra.service.js";
import { RedisCachePlugin } from "#/auth/msal.plugin.js";
import config from "#/config.js";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#/lib/constants/http.js";
import { getRedisClient } from "#/lib/redis.js";
import { logger } from "#/logger.js";

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
    const { data, success } = authCodeCallbackSchema.safeParse(req.query);
    if (!success) {
      res.status(BAD_REQUEST).send("Invalid redirect payload");
      return;
    }

    // exit early if callback is relayed to ephemeral env
    if (handleRelay(data, req, res)) return;

    // verify that session contains correct flow state
    const { authCodeRequest, authState, returnTo } = req.session;
    if (authCodeRequest === undefined) {
      res.status(BAD_REQUEST).send(new MissingAuthCodeRequestError().message);
      return;
    }
    if (authState === undefined || data.state !== authState) {
      res.status(BAD_REQUEST).send(new StateMismatchError().message);
      return;
    }

    const cachePlugin = new RedisCachePlugin(
      getRedisClient(),
      req.sessionID,
      config.redis.maxAge,
    );
    const entra = EntraService.create({
      cachePlugin,
      requestHostname: req.hostname,
    });

    // exchange auth code for tokens and state
    const result = await entra.exchangeAuthCode(data.code, authCodeRequest);
    if (result.error) {
      res.status(UNAUTHORIZED).send(result.error.message);
      return;
    }

    // establish a new session ID
    req.session.regenerate((error: Error | null | undefined) => {
      if (error) {
        next(error);
        return;
      }

      const { account } = result.value;
      Object.assign(req.session, { account, isAuthenticated: true });
      res.redirect(returnTo ?? "/");
    });
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
  const cachePlugin = new RedisCachePlugin(
    getRedisClient(),
    req.sessionID,
    config.redis.maxAge,
  );
  const entra = EntraService.create({
    cachePlugin,
    requestHostname: req.hostname,
  });

  const returnToOverride = parseSafeReturnToOverride(req);
  if (returnToOverride !== undefined) {
    req.session.returnTo = returnToOverride;
  }

  try {
    const result = await entra.initiateAuthCodeFlow(req.session.returnTo);
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
  try {
    req.session.destroy((error: Error | null) => {
      if (error) {
        next(error);
        return;
      }

      res.clearCookie(config.session.name);
      res.redirect("/");
    });
  } catch (error) {
    next(error);
  }
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
