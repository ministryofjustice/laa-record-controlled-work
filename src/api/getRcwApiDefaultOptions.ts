import type { getApplications } from "#/api/clients/rcw/schema/applications/applications.gen.js";

import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { EntraService } from "#/auth/entra.service.js";
import config from "#/config.js";
import { logger } from "#/logger.js";

export interface RcwApiAuthParams {
  homeAccountId: string | undefined;
  sessionId: string | undefined;
}

type RcwApiDefaultOptions = typeof getApplications extends (
  options?: infer TOptions,
) => unknown
  ? NonNullable<TOptions>
  : never;

const EMPTY_STRING_LENGTH = 0;
const TEST_ACCESS_TOKEN = "test-access-token";

/**
 * Builds default authenticated options for downstream RCW API requests.
 * @param params - Explicit auth context required to build RCW API auth headers.
 * @returns API request options with the Authorization bearer token header.
 */
export async function getRcwApiDefaultOptions(
  params: RcwApiAuthParams,
): Promise<RcwApiDefaultOptions> {
  if (config.api.useMockAccessToken) {
    return {
      headers: {
        Authorization: `Bearer ${TEST_ACCESS_TOKEN}`,
      },
    };
  }

  const sessionId = params.sessionId?.trim();
  if (sessionId === undefined || sessionId.length === EMPTY_STRING_LENGTH) {
    logger.error(
      "Failed to get expected session id for Entra token refresh",
      undefined,
    );
    throw new NotAuthenticatedError();
  }

  const homeAccountId = params.homeAccountId?.trim();
  if (
    homeAccountId === undefined ||
    homeAccountId.length === EMPTY_STRING_LENGTH
  ) {
    logger.warn("Authenticated session missing MSAL account reference", {
      hasHomeAccountId: false,
      sessionId,
    });
    throw new NotAuthenticatedError();
  }

  const entraService = EntraService.create({ sessionId });
  const tokenResult = await entraService.acquireDownstreamAccessToken(
    homeAccountId,
    config.entra.scopes,
  );
  if (tokenResult.error) {
    throw tokenResult.error;
  }

  return {
    headers: {
      Authorization: `Bearer ${tokenResult.value}`,
    },
  };
}
