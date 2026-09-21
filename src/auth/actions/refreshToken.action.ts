import type { AuthenticationResult } from "@azure/msal-node";

import type { TokenRefreshError } from "#/auth/auth.errors.js";

import { EntraService } from "#/auth/entra.service.js";
import config from "#/config.js";
import { type Either, failure, success } from "#/lib/either.js";

/**
 * Refreshes an Entra Access Token.
 *
 * @param homeAccountId - MSAL account reference stored in `session.account.homeAccountId`.
 * @param sessionId - Session identifier stored in `session.id`.
 * @returns Either a refreshed access token or an auth-related refresh error.
 */
export async function refreshToken(
  homeAccountId: string,
  sessionId: string,
): Promise<Either<TokenRefreshError, AuthenticationResult>> {
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
