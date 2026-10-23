import type { NextFunction, Request, Response } from "express";

import { AuthError } from "@azure/msal-node";
import { promisify } from "node:util";

import type { Either } from "#/lib/either.js";

import {
  AuthenticationError,
  BadAuthenticationRequestError,
  TokenAcquisitionError,
} from "#/auth/auth.errors.js";
import { getValidatedReturnTo } from "#/auth/auth.redirect.js";
import {
  decodeRelayState,
  isAllowedRelayTarget,
  verifyRelayState,
} from "#/auth/auth.relay.js";
import {
  authCodeCallbackErrorSchema,
  authCodeCallbackSchema,
} from "#/auth/auth.types.js";
import {
  type AuthFlow,
  type AuthFlowStore,
  getAuthFlowStore,
} from "#/auth/authCodeFlow/factory.js";
import { EntraErrorCode } from "#/auth/domain/EntraErrorCode.enum.js";
import { EntraService } from "#/auth/entra.service.js";
import { getMsalCacheKey } from "#/auth/msal.cache-key.js";
import config from "#/config.js";
import {
  FORBIDDEN,
  PRIVATE_NO_STORE_CACHE_CONTROL,
} from "#/lib/constants/http.js";
import { getRedisClient } from "#/lib/redis.js";
import { logger } from "#/logger.js";

const EMPTY_STRING_LENGTH = 0;

type CallbackData =
  { code: string; state: string } | { error: string; state: string };

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
    const callbackData = getValidatedCallbackData(req, res);

    if (callbackData === undefined) {
      return;
    }

    if (handleRelay(callbackData, req, res)) return;

    let consumed: Either<Error, AuthFlow | undefined>;

    try {
      consumed = await getRequestAuthFlowStore(req.app).consume(
        req.sessionID,
        callbackData.state,
      );
    } catch (error) {
      next(new AuthenticationError("Unable to complete sign-in", error));
      return;
    }

    if (consumed.error) {
      const { error } = consumed;
      next(new AuthenticationError("Unable to complete sign-in", error));
      return;
    }

    if (consumed.value === undefined) {
      next(
        new BadAuthenticationRequestError("Invalid or expired sign-in flow"),
      );
      return;
    }

    const flow = consumed.value;

    if ("error" in callbackData) {
      next(new BadAuthenticationRequestError("Entra sign-in failed"));
      return;
    }

    await completeAuthCodeCallback(req, res, callbackData, flow);
  } catch (error) {
    next(error);
  }
}

/**
 * Initiates the Entra sign-in flow by generating a PKCE auth code URL.
 * @param req - The Express request.
 * @param res - The Express response.
 * @param next - The Express next function, unused by this handler.
 */
export async function signIn(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const returnTo =
    req.query.returnTo === undefined
      ? getValidatedReturnTo(req.session.returnTo)
      : getValidatedReturnTo(req.query.returnTo);

  try {
    const authCodeUrl = await prepareSignInFlow(req, returnTo);
    res.redirect(authCodeUrl);
  } catch (error) {
    if (
      error instanceof AuthError &&
      error.errorCode === EntraErrorCode.CUSTOM_AUTH_ERROR.valueOf()
    ) {
      logger.info(
        `Received Entra error "${error.errorCode}" when authenticating user: ${error.message}`,
      );
      res.status(FORBIDDEN).render("main/error-no-assigned-role");
      return;
    }

    next(new AuthenticationError("Unable to start sign-in", error));
  }
}

/**
 * Destroys the session and redirects to the root.
 * @param req - The Express request.
 * @param res - The Express response.
 * @param next - The Express next function.
 */
export async function signOut(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const sessionId = req.sessionID;
  let cleanupFailed = false;

  try {
    await destroySession(req);
  } catch (error) {
    cleanupFailed = true;
    logger.error("Failed to destroy local session during sign-out", error);
  }

  res.clearCookie(config.session.name);

  try {
    await deleteMsalCache(sessionId);
  } catch (error) {
    cleanupFailed = true;
    logger.error("Failed to delete local MSAL cache during sign-out", error);
  }

  if (cleanupFailed) {
    next(new Error("Unable to complete sign-out"));
    return;
  }

  res.redirect("/");
}

/**
 * Rotates the initiating session, exchanges the code, and persists authentication.
 * @param req - The callback request.
 * @param res - The callback response.
 * @param data - The validated successful callback data.
 * @param data.code - The authorization code returned by Entra.
 * @param data.state - The matching OAuth state.
 * @param flow - The atomically consumed flow.
 */
async function completeAuthCodeCallback(
  req: Request,
  res: Response,
  data: { code: string; state: string },
  flow: AuthFlow,
): Promise<void> {
  await regenerateSession(req);
  const entra = EntraService.create({ sessionId: req.sessionID });
  const result = await entra.exchangeAuthCode(data.code, flow.authCodeRequest);

  if (result.error) {
    throw result.error;
  }

  const homeAccountId = result.value.account?.homeAccountId.trim();
  if (
    homeAccountId === undefined ||
    homeAccountId.length === EMPTY_STRING_LENGTH
  ) {
    logger.error("Token exchange succeeded without an account homeAccountId");
    throw new TokenAcquisitionError();
  }

  Object.assign(req.session, {
    account: result.value.account,
    isAuthenticated: true,
    msal: { homeAccountId },
  });
  if (!(await persistAuthenticatedSession(req, res))) return;

  res.redirect(getValidatedReturnTo(flow.returnTo));
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
 * Destroys the callback session after persistence fails.
 * @param req - The callback request.
 */
async function destroySession(req: Request): Promise<void> {
  const destroy = promisify(
    (callback: (error?: Error | null) => void): void => {
      req.session.destroy(callback);
    },
  );
  await destroy();
}

/**
 * Returns the app-scoped flow store, or the production singleton by default.
 * @param app - The application providing an optional flow store.
 * @param app.locals - The application-local values.
 * @param app.locals.authFlowStore - The optional app-scoped flow store.
 * @returns The app store when supplied, otherwise the default store.
 */
function getRequestAuthFlowStore(app: {
  locals: { authFlowStore?: AuthFlowStore };
}): AuthFlowStore {
  return app.locals.authFlowStore ?? getAuthFlowStore();
}

/**
 * Validates callback payload, relay behavior, and session flow state.
 * @param req - The Express request.
 * @param res - Express response.
 * @returns Callback state when valid; otherwise undefined after response is handled.
 */
function getValidatedCallbackData(
  req: Request,
  res: Response,
): CallbackData | undefined {
  const hasCode = Object.hasOwn(req.query, "code");
  const hasError = Object.hasOwn(req.query, "error");

  if (hasCode === hasError) {
    throw new BadAuthenticationRequestError("Invalid redirect payload");
  }

  const parsed = hasCode
    ? authCodeCallbackSchema.safeParse(req.query)
    : authCodeCallbackErrorSchema.safeParse(req.query);

  if (!parsed.success) {
    throw new BadAuthenticationRequestError("Invalid redirect payload");
  }

  return parsed.data;
}

/**
 * If the state encodes a signed relay target for a different host, validates
 * the signature and redirects the callback to that ephemeral environment.
 * @param data - The parsed auth code response.
 * @param data.code - The authorisation code when the provider succeeds.
 * @param data.error - The provider error when authentication fails.
 * @param data.state - The OAuth state parameter.
 * @param req - The Express request.
 * @param res - The Express response.
 * @returns true if the response was handled (redirected or rejected), false if
 *          the callback should be processed locally.
 */
function handleRelay(data: CallbackData, req: Request, res: Response): boolean {
  const decoded = decodeRelayState(data.state);
  if (decoded.kind === "plain") return false;
  if (decoded.kind === "invalid") {
    throw new BadAuthenticationRequestError("Invalid redirect target");
  }

  const relayState = decoded.state;
  const { target } = relayState;
  if (
    !verifyRelayState(relayState, config.session.secret) ||
    !isAllowedRelayTarget(target)
  ) {
    throw new BadAuthenticationRequestError("Invalid redirect target");
  }

  const targetUrl = new URL(target);
  if (targetUrl.hostname === req.hostname) return false;

  targetUrl.pathname = "/auth/code/callback";
  if ("code" in data) {
    targetUrl.searchParams.set("code", data.code);
  } else {
    targetUrl.searchParams.set("error", data.error);
  }
  targetUrl.searchParams.set("state", data.state);

  logger.info("Relaying auth callback", { targetHostname: targetUrl.hostname });
  res.set("Cache-Control", PRIVATE_NO_STORE_CACHE_CONTROL);
  res.redirect(targetUrl.toString());
  return true;
}

/**
 * Saves authenticated state or destroys the failed session and cache partition.
 * @param req - The authenticated callback request.
 * @param res - The callback response.
 * @returns True when the authenticated session was saved.
 */
async function persistAuthenticatedSession(
  req: Request,
  res: Response,
): Promise<boolean> {
  const sessionId = req.sessionID;
  try {
    await saveSession(req);
    return true;
  } catch (initialError) {
    try {
      await destroySession(req);
    } catch (error) {
      logger.error("Failed to destroy unauthenticated callback session", error);
    }
    res.clearCookie(config.session.name);
    try {
      await deleteMsalCache(sessionId);
    } catch (error) {
      logger.error("Failed to delete unauthenticated MSAL cache", error);
    }
    throw new AuthenticationError("Unable to complete sign-in", initialError);
  }
}

/**
 * Prepares a flow and authorizes its IdP redirect only while its reservation is current.
 * @param req - The initiating request.
 * @param returnTo - The validated local destination to persist in the flow.
 * @returns The prepared IdP authorization URL.
 */
async function prepareSignInFlow(
  req: Request,
  returnTo: string,
): Promise<string> {
  const flowStore = getRequestAuthFlowStore(req.app);
  const reservation = await flowStore.reserve(req.sessionID);
  if (reservation.error) throw reservation.error;

  const { expiresAt, reservationId } = reservation.value;
  const { session } = req;
  const previousPending = session.authFlowPending;
  try {
    const entra = EntraService.create({ sessionId: req.sessionID });
    const result = await entra.initiateAuthCodeFlow(returnTo, {
      callbackHostname: req.hostname,
      expiresAt,
    });
    if (result.error) throw result.error;

    const { authCodeRequest, authCodeUrl, authState } = result.value;
    const published = await flowStore.publish(req.sessionID, reservationId, {
      authCodeRequest,
      authState,
      returnTo: getValidatedReturnTo(result.value.returnTo),
    });
    if (published.error) throw published.error;
    if (!published.value) throw new Error("Auth flow was superseded");

    session.authFlowPending = reservationId;
    await saveSession(req);

    const authorized = await flowStore.authorizeRedirect(
      req.sessionID,
      reservationId,
    );
    if (authorized.error) throw authorized.error;
    if (!authorized.value) throw new Error("Auth flow was superseded");

    return authCodeUrl;
  } catch (error) {
    session.authFlowPending = previousPending;
    await flowStore.abandon(req.sessionID, reservationId);
    throw error;
  }
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

/**
 * Persists the current session before redirecting to the IdP.
 * @param req - The initiating request.
 */
async function saveSession(req: Request): Promise<void> {
  const save = promisify((callback: (error?: Error | null) => void): void => {
    req.session.save(callback);
  });
  await save();
}
