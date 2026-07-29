import type {
  Office,
  SelectOfficeEffectsDeps,
  SelectOfficesContext,
  SelectOfficeSession,
} from "#/journeys/select-office/select-office.types.js";

import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import { getPdaApiDefaultOptions } from "#/api/getPdaApiDefaultOptions.js";
import { ID_TOKEN_CLAIMS } from "#/auth/auth.constant.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { InvalidFirmCodeClaimError } from "#/journeys/journey.errors.js";
import { mapOffices } from "#/journeys/select-office/mappers/office.dto.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

export const loadOffices =
  (deps: SelectOfficeEffectsDeps) => async (context: SelectOfficesContext) => {
    let response;
    const firmId = getFirmIdFromSession(context);

    try {
      const opts = getPdaApiDefaultOptions();
      response = await deps.getAllProviderOffices(firmId, opts);
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
    const officeList: ProviderFirmOfficeListDto = result.data;

    const mappedOffices: Office[] = mapOffices(officeList.offices ?? []);

    context.setData(CONTEXT_DATA_KEYS.officeList, mappedOffices);
  };

/**
 * Reads and validates the numeric firm identifier from the authenticated account claims.
 * @param context Journey effect context containing the current session.
 * @returns Firm identifier required by the PDA provider offices API.
 */
function getFirmIdFromSession(context: SelectOfficesContext): number {
  const session = context.getSession();
  const claims = getTokenClaims(session);
  const firmCode = claims?.[ID_TOKEN_CLAIMS.firmCode];

  if (typeof firmCode !== "number" && typeof firmCode !== "string") {
    throw new InvalidFirmCodeClaimError();
  }
  if (typeof firmCode === "string") {
    const parsedFirmCode = Number.parseInt(firmCode, 10);

    return parsedFirmCode;
  }

  return firmCode;
}

/**
 * Safely extracts ID token claims from the authenticated session account.
 * @param session Current journey session.
 * @returns Claims object when present.
 */
function getTokenClaims(
  session: SelectOfficeSession,
): Record<string, unknown> | undefined {
  if (!isRecord(session)) {
    return undefined;
  }

  const { account } = session;
  if (!isRecord(account)) {
    return undefined;
  }

  const { idTokenClaims } = account;

  if (!isRecord(idTokenClaims)) {
    return undefined;
  }

  return idTokenClaims;
}

/**
 * Type guard for plain object-like values.
 * @param value Unknown runtime value.
 * @returns True when value is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
