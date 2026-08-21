import config from "#/config.js";
import { PDA_MSW_LAA_ACCOUNTS_HEADER } from "#/lib/constants/pda.js";
import { getGetAllProviderOfficesMockHandler } from "#orval/mocks/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";

import { getProviderOfficesResponse } from "../fixtures/pda.js";

/**
 * Reads the LAA_ACCOUNTS office codes forwarded by the app for the current
 * request, so mocked PDA offices align with the real signed-in user's claims.
 * @param request Intercepted PDA request.
 * @returns Office codes to align the mock response with, or undefined.
 */
export function readLaaAccountsHeader(request: Request): string[] | undefined {
  const header = request.headers.get(PDA_MSW_LAA_ACCOUNTS_HEADER);
  if (header === null) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(header);
    return Array.isArray(parsed)
      ? parsed.filter((code): code is string => typeof code === "string")
      : undefined;
  } catch {
    return undefined;
  }
}

export const pdaApiHandlers = [
  getGetAllProviderOfficesMockHandler(({ request }) =>
    getProviderOfficesResponse(
      config.api.pda.mswOfficeCount,
      readLaaAccountsHeader(request),
    ),
  ),
];
