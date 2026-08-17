import { faker } from "@faker-js/faker";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";

import { getGetAllProviderOfficesResponseMock } from "#orval/mocks/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";

const FIRST_OFFICE_INDEX = 0;
const FAKER_SEED = 12345;

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
  faker.seed(FAKER_SEED);

  const providerOfficesResponse = getGetAllProviderOfficesResponseMock();
  const offices = officeCodes
    ? officeCodes.map((firmOfficeCode, index) => ({
        ...providerOfficesResponse.offices[
          index % providerOfficesResponse.offices.length
        ],
        firmOfficeCode,
      }))
    : providerOfficesResponse.offices.slice(
        FIRST_OFFICE_INDEX,
        limitNumberOfOffices,
      );

  return {
    ...providerOfficesResponse,
    offices,
  };
}
