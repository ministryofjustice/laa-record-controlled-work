import type {
  SelectOfficeContext,
  SelectOfficeEffectsDeps,
} from "#/journeys/select-office/select-office.types.js";

import {
  ApiResponseError,
  ApiValidationError,
} from "#/api/clients/api.errors.js";
import { getPdaApiDefaultOptions } from "#/api/clients/getPdaApiDefaultOptions.js";
import { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import { ID_TOKEN_CLAIMS_KEYS } from "#/auth/auth.constants.js";
import config from "#/config.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  InvalidFirmCodeClaimError,
  InvalidSessionError,
} from "#/journeys/journey.errors.js";
import { mapAvailableOffices } from "#/journeys/select-office/mappers/mapAvailableOffices.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { PDA_MSW_LAA_ACCOUNTS_HEADER } from "#/lib/constants/pda.js";
import { logger } from "#/logger.js";

export const loadOffices =
  (deps: SelectOfficeEffectsDeps) => async (context: SelectOfficeContext) => {
    let response;
    const firmCode = getFirmCodeFromSession(context);
    const laaAccounts =
      context.getSession()?.account?.idTokenClaims?.[
        ID_TOKEN_CLAIMS_KEYS.laaAccounts
      ];
    const laaAccountCodes = parseOfficeCodesClaim(laaAccounts);
    const correlationId = context
      .getRequestHeader("x-correlation-id")
      ?.toString();

    try {
      const opts = getPdaApiDefaultOptions(
        correlationId,
        config.api.pda.mode === "msw"
          ? {
              [PDA_MSW_LAA_ACCOUNTS_HEADER]: JSON.stringify(laaAccountCodes),
            }
          : undefined,
      );
      response = await deps.getAllProviderOffices(firmCode, opts);
    } catch (error) {
      logger.error("Error fetching offices", error, {
        api: "getAllProviderOffices",
      });
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.OK) {
      logger.error(
        "getAllProviderOffices did not return 200",
        {
          data: response.data,
          status: response.status,
        },
        {
          api: "getAllProviderOffices",
        },
      );
      throw new ApiResponseError();
    }

    const result = ProviderFirmOfficeListDto.safeParse(response.data);

    if (!result.success) {
      logger.error(
        "ProviderFirmOfficeListDto response data failed validation",
        result.error,
      );
      throw ApiValidationError.from(result.error);
    }
    const mappedOffices = mapAvailableOffices(result.data);
    const availableOffices = mappedOffices.filter((o) =>
      laaAccountCodes.includes(o.code),
    );

    context.setData(CONTEXT_DATA_KEYS.availableOffices, availableOffices);
  };

/**
 * Reads and validates the numeric firm code from the authenticated account claims.
 * @param context Journey effect context containing the current session.
 * @returns Firm code required by the PDA provider offices API.
 */
function getFirmCodeFromSession(context: SelectOfficeContext): number {
  const session = context.getSession();
  if (!session) {
    throw new InvalidSessionError();
  }

  const claims = session.account?.idTokenClaims;

  const firmCode = claims?.[ID_TOKEN_CLAIMS_KEYS.firmCode];

  if (typeof firmCode !== "number" && typeof firmCode !== "string") {
    logger.error(
      "Missing or invalid FIRM_CODE claim in authenticated account",
      {
        claims,
      },
    );
    throw new InvalidFirmCodeClaimError();
  }
  if (typeof firmCode === "string") {
    const parsedFirmCode = Number.parseInt(firmCode, 10);
    return parsedFirmCode;
  }

  return firmCode;
}

/**
 * Reads office codes from array and serialized-array Entra claims.
 * @param claim LAA_ACCOUNTS claim from the authenticated account.
 * @returns Valid office-code strings from the claim.
 */
function parseOfficeCodesClaim(claim: unknown): string[] {
  if (Array.isArray(claim)) {
    return claim.filter(
      (account): account is string => typeof account === "string",
    );
  }

  if (typeof claim !== "string") {
    return [];
  }

  try {
    const parsedClaim: unknown = JSON.parse(claim);
    return Array.isArray(parsedClaim)
      ? parsedClaim.filter(
          (account): account is string => typeof account === "string",
        )
      : [];
  } catch {
    return [];
  }
}
