import type { getApplications } from "#/api/client/schema/applications/applications.gen.js";
import type { SessionInterface } from "#/app/session.types.js";

import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { EntraService } from "#/auth/entra.service.js";
import { logger } from "#/logger.js";

export interface GetRcwApiDefaultOptionsParams {
  session: SessionInterface | undefined;
}

type RcwApiDefaultOptions = typeof getApplications extends (
  options?: infer TOptions,
) => unknown
  ? NonNullable<TOptions>
  : never;

const TEST_ACCESS_TOKEN = "test-access-token";

/**
 * Builds default authenticated options for downstream RCW API requests.
 * @param params - Explicit auth context required to build RCW API auth headers.
 * @returns API request options with the Authorization bearer token header.
 */
export async function getRcwApiDefaultOptions(
  params: GetRcwApiDefaultOptionsParams,
): Promise<RcwApiDefaultOptions> {
  if (process.env.NODE_ENV === "test") {
    return {
      headers: {
        Authorization: `Bearer ${TEST_ACCESS_TOKEN}`,
      },
    };
  }

  const { session } = params;
  const account = session?.account;
  if (account === undefined) {
    logger.error(
      "Failed to get expected account from session, user may not be authenticated",
      undefined,
    );
    throw new NotAuthenticatedError();
  }

  const sessionId = session?.id;
  if (sessionId === undefined) {
    logger.error(
      "Failed to get expected session id for Entra token refresh",
      undefined,
    );
    throw new NotAuthenticatedError();
  }

  const entraService = EntraService.create({ sessionId });
  const tokenResult = await entraService.acquireTokenSilent(account);
  if (tokenResult.error) {
    throw tokenResult.error;
  }

  const { accessToken } = tokenResult.value;
  if (accessToken === undefined) {
    logger.error(
      "Failed to get expected accessToken from Entra token refresh",
      undefined,
    );
    throw new NotAuthenticatedError();
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}
