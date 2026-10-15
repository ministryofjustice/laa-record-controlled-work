import { faker } from "@faker-js/faker";

import type { ProviderFirmOfficeDto } from "#/api/clients/pda/model/providerFirmOfficeDto.zod.gen.js";

import { getGetFirmOfficeResponseMock } from "#orval/mocks/pda/msw/provider-firm-offices/provider-firm-offices.msw.gen.js";

const FAKER_SEED = 12345;

/**
 * Creates deterministic office details correlated to a requested code.
 * @param officeCode Office code to include in the response.
 * @returns Generated PDA office details.
 */
export function getProviderOfficeResponse(
  officeCode: string,
): ProviderFirmOfficeDto {
  faker.seed(FAKER_SEED);

  const officeResponse = getGetFirmOfficeResponseMock();

  return {
    ...officeResponse,
    office: {
      ...officeResponse.office,
      firmOfficeCode: officeCode,
    },
  };
}
