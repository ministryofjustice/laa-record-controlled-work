import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { SessionInterface } from "#/app/session.types.js";
import type { TokenExchangeResult } from "#/auth/auth.types.js";

import {
  NotAuthenticatedError,
  TokenRefreshError,
} from "#/auth/auth.errors.js";
import { EntraService } from "#/auth/entra.service.js";
import { createMsalClient } from "#/auth/msal.client.js";
import { RedisCachePlugin } from "#/auth/msal.plugin.js";
import config from "#/config.js";
import { getRedisClient } from "#/lib/redis.js";
import { logger } from "#/logger.js";

const createEntraService = (
  requestHostname: string,
  sessionID: string,
): EntraService => {
  const msalCachePlugin = config.redis.enabled
    ? new RedisCachePlugin(getRedisClient(), sessionID, config.redis.maxAge)
    : undefined;

  const msalClient = createMsalClient({ msalCachePlugin });

  return EntraService.create({
    msalClient,
    requestHostname,
  });
};

/**
 * Get the RCW access token from a ForgeEffectFunctionContext
 * @param context  The Forge context.
 * @returns string | null
 * @throws NotAuthenticatedError
 */
export const getAuthTokenFromForgeContext = async (
  context: EffectFunctionContext,
): Promise<string> => {
  const { account, id: sessionID } =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Despite the lack of type hinting, it does return our expected SessionInterface.
    context.getSession() as SessionInterface;

  if (!account) {
    throw new NotAuthenticatedError("Failed to get expected account for user");
  }

  const requestUrl = context.getRequestUrl();
  const requestHostname = new URL(requestUrl).hostname;

  const entraService = createEntraService(requestHostname, sessionID);
  const resultOrError = await entraService.acquireTokenSilent(account);

  if (resultOrError instanceof TokenRefreshError) {
    logger.error("Failed to get expected auth token for user", resultOrError);
    throw new NotAuthenticatedError(resultOrError);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Narrowing the Either does not actually narrow the type of the value, so we have to assert it here.
  const result = resultOrError as unknown as TokenExchangeResult;

  if (!result.accessToken) {
    logger.error("Unexpected empty access token", undefined);
    throw new NotAuthenticatedError();
  }

  return result.accessToken;
};
