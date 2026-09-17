import type {
  NotAuthenticatedError,
  TokenRefreshError,
} from "#/auth/auth.errors.js";

import { EntraService } from "#/auth/entra.service.js";
import config from "#/config.js";
import { type Either, failure, success } from "#/lib/either.js";

/**
 * Refreshes the current Entra access token for the authenticated session context.
 *
 * @param homeAccountId - MSAL account reference stored in session.
 * @param sessionId - Session identifier used for scoped MSAL cache access.
 * @returns Either a refreshed access token or an auth-related refresh error.
 */
export async function refreshAuthToken(
  homeAccountId: string,
  sessionId: string,
): Promise<Either<NotAuthenticatedError | TokenRefreshError, string>> {
  const entraService = EntraService.create({ sessionId });

  const tokenResult = await entraService.refreshToken(
    homeAccountId,
    config.entra.scopes,
  );

  if (tokenResult.error) {
    return failure(tokenResult.error);
  }

  return success(tokenResult.value);
}
