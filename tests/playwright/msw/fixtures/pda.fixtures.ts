import { faker } from "@faker-js/faker";

import { mapAvailableOffices } from "#/journeys/select-office/mappers/mapAvailableOffices.js";
import { getGetAllProviderOfficesResponseMock } from "#orval/mocks/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";

// Keep generated fixture data deterministic across test runs.
faker.seed(12345);

export function getProviderOfficesResponse(limitNumberOfOffices: number) {
  const providerOfficesResponse = getGetAllProviderOfficesResponseMock();

  return {
    ...providerOfficesResponse,
    offices: providerOfficesResponse.offices.slice(0, limitNumberOfOffices),
  };
}

export function getMappedOffices(limitNumberOfOffices: number) {
  return mapAvailableOffices(getProviderOfficesResponse(limitNumberOfOffices));
}