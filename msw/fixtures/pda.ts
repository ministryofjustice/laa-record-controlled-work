import { faker } from "@faker-js/faker";

import { getGetAllProviderOfficesResponseMock } from "#orval/mocks/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";

// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- actually magic
faker.seed(12345);

/**
 * .
 * @param limitNumberOfOffices .
 * @returns .
 */
export function getProviderOfficesResponse(
  limitNumberOfOffices: number,
): unknown {
  const providerOfficesResponse = getGetAllProviderOfficesResponseMock();

  return {
    ...providerOfficesResponse,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- intuitive
    offices: providerOfficesResponse.offices.slice(0, limitNumberOfOffices),
  };
}
