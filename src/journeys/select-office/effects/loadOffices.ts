import type {
  SelectOfficeContext,
  SelectOfficeEffectsDeps,
} from "#/journeys/select-office/select-office.types.js";

import {
  ApiResponseError,
  ApiValidationError,
} from "#/api/clients/api.errors.js";
import { getPdaApiDefaultOptions } from "#/api/clients/getPdaApiDefaultOptions.js";
import { ProviderFirmOfficeDto } from "#/api/clients/pda/model/providerFirmOfficeDto.zod.gen.js";
import { ID_TOKEN_CLAIMS_KEYS } from "#/auth/auth.constants.js";
import { AuthenticationError } from "#/auth/auth.errors.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  InvalidOfficeError,
  NoAvailableOfficesError,
} from "#/journeys/journey.errors.js";
import { mapAvailableOffice } from "#/journeys/select-office/mappers/mapAvailableOffice.js";
import { getSessionDataOrThrow } from "#/journeys/shared.helper.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import * as metrics from "#/lib/metrics.js";
import { logger } from "#/logger.js";

const EMPTY = 0;

export const loadOffices =
  (deps: SelectOfficeEffectsDeps) => async (context: SelectOfficeContext) => {
    const session = getSessionDataOrThrow(context);

    const laaAccounts =
      session.account?.idTokenClaims?.[ID_TOKEN_CLAIMS_KEYS.laaAccounts];
    const officeCodes = [...new Set(parseOfficeCodesClaim(laaAccounts))];
    if (officeCodes.length === EMPTY) {
      logger.error("No office codes found in LAA_ACCOUNTS claim");
      throw new NoAvailableOfficesError();
    }

    const correlationId = context
      .getRequestHeader("x-correlation-id")
      ?.toString();
    const options = getPdaApiDefaultOptions(correlationId);

    const results = await Promise.allSettled(
      officeCodes.map(async (officeCode) => {
        const response = await metrics.time(
          "getFirmOffice",
          async () => await deps.getFirmOffice(officeCode, options),
          (status) => status === HTTP_STATUS.OK,
        );

        if (response.status !== HTTP_STATUS.OK) {
          throw new ApiResponseError();
        }

        const result = ProviderFirmOfficeDto.safeParse(response.data);
        if (!result.success) {
          throw ApiValidationError.from(result.error);
        }

        if (result.data.office?.firmOfficeCode !== officeCode) {
          throw new InvalidOfficeError();
        }

        return mapAvailableOffice(result.data);
      }),
    );

    const availableOffices = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      logger.error("Provider office lookup failed; using code-only office", {
        api: "getFirmOffice",
      });
      return { code: officeCodes[index] };
    });

    context.setData(CONTEXT_DATA_KEYS.availableOffices, availableOffices);
  };

/**
 * Reads office codes from array and serialized-array Entra claims.
 *
 * @param claim LAA_ACCOUNTS  Claim from the authenticated account.
 * @returns  Valid office-code strings from the claim.
 * @throws AuthenticationError  If the claim cannot be processed.
 */
function parseOfficeCodesClaim(claim: string | string[] | undefined): string[] {
  // If the claim is a single string, we only have a single office code.
  if (typeof claim === "string") {
    return [claim];
  }

  // If the claim is an array, we have a set of office codes.
  if (Array.isArray(claim)) {
    return claim.filter((item) => typeof item === "string");
  }

  // Anything else is invalid and can't be processed, so throw an error.
  throw new AuthenticationError(
    `Invalid LAA_ACCOUNTS claim format ${typeof claim}: expected string or array of strings`,
  );
}
