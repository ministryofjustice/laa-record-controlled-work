import type {
  Office,
  SelectOfficeContext,
  SelectOfficeEffectsDeps,
} from "#/journeys/select-office/select-office.types.js";

import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import { getPdaApiDefaultOptions } from "#/api/getPdaApiDefaultOptions.js";
import { ID_TOKEN_CLAIMS } from "#/auth/auth.constant.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  InvalidFirmCodeClaimError,
  MissingSessionError,
} from "#/journeys/journey.errors.js";
import { mapOffices } from "#/journeys/select-office/mappers/office.dto.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

export const loadOffices =
  (deps: SelectOfficeEffectsDeps) => async (context: SelectOfficeContext) => {
    let response;
    const firmId = getFirmIdFromSession(context);
    const correlationId = context
      .getRequestHeader("x-correlation-id")
      ?.toString();

    try {
      const opts = getPdaApiDefaultOptions(correlationId);
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
function getFirmIdFromSession(context: SelectOfficeContext): number {
  const session = context.getSession();
  if (!session) {
    throw new MissingSessionError();
  }

  const claims = session.account?.idTokenClaims;

  const firmCode = claims?.[ID_TOKEN_CLAIMS.firmCode];

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
