import { faker } from "@faker-js/faker";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";

import { getGetAllProviderOfficesResponseMock } from "#orval/mocks/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";

const FIRST_OFFICE_INDEX = 0;

// officeCodes (forwarded from the signed-in user's LAA_ACCOUNTS claim, see
// msw/handlers/pda.ts) overrides these seeded codes, so no manual sync needed.
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- actually magic
faker.seed(12345);

/**
 * .
 * @param limitNumberOfOffices .
 * @param officeCodes .
 * @returns .
 */
export function getProviderOfficesResponse(
  limitNumberOfOffices: number,
  officeCodes?: string[],
): ProviderFirmOfficeListDto {
  const providerOfficesResponse = getGetAllProviderOfficesResponseMock();
  const numberOfOffices = officeCodes?.length ?? limitNumberOfOffices;

  return {
    ...providerOfficesResponse,
    offices: providerOfficesResponse.offices
      .slice(FIRST_OFFICE_INDEX, numberOfOffices)
      .map((office, index) => ({
        ...office,
        firmOfficeCode: officeCodes?.at(index) ?? office.firmOfficeCode,
      })),
  };
}
