import { faker } from "@faker-js/faker";
import { mapAvailableOffices } from "#/journeys/select-office/mappers/mapAvailableOffices.js";
import { getGetAllProviderOfficesResponseMock } from "../../mocks/api/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";

// keeps the faker data consistent across test runs, so that the same mock data is used for each test run and msw handlers
faker.seed(12345);

export function getProviderOfficesResponse(limitNumberOfOffices: number) {
  const providerOfficesResponse = getGetAllProviderOfficesResponseMock();
  // slice only trims - the generator itself yields 1-10 offices, so this is a ceiling, not an exact count.
  return {
    ...providerOfficesResponse,
    offices: providerOfficesResponse.offices.slice(0, limitNumberOfOffices),
  };
}

export function getMappedOffices(limitNumberOfOffices: number) {
  return mapAvailableOffices(getProviderOfficesResponse(limitNumberOfOffices));
}
