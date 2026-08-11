import type { Office } from "#/journeys/select-office/select-office.types.js";

import { mapAvailableOffices } from "#/journeys/select-office/mappers/mapAvailableOffices.js";
import { getProviderOfficesResponse } from "#msw/fixtures/pda.js";

/**
 * Maps mock office response data to journey office options.
 * @param limitNumberOfOffices Number of offices to include from fixtures.
 * @returns Office options used in journey tests.
 */
export function getMappedOffices(limitNumberOfOffices: number): Office[] {
  return mapAvailableOffices(getProviderOfficesResponse(limitNumberOfOffices));
}
