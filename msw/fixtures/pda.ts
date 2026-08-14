import { faker } from "@faker-js/faker";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";

import { getGetAllProviderOfficesResponseMock } from "#orval/mocks/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";

// if you change this, make sure you update the office codes in LAA_ACCOUNTS in
// mock-oauth2-config.json and mock-oauth2-login.html
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- actually magic
faker.seed(12345);

/**
 * .
 * @param limitNumberOfOffices .
 * @returns .
 */
export function getProviderOfficesResponse(
  limitNumberOfOffices: number,
): ProviderFirmOfficeListDto {
  const providerOfficesResponse = getGetAllProviderOfficesResponseMock();

  return {
    ...providerOfficesResponse,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- intuitive
    offices: providerOfficesResponse.offices.slice(0, limitNumberOfOffices),
  };
}
