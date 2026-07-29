import type { OfficesContext } from "#/journeys/select-office/select-office.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export const setSelectedOffice = () => (context: OfficesContext) => {
  const selectedOffice = {
    address: "123 Fake Street",
    code: "A123456",
    displayName: "London Office",
  };

  // TODO add to session
  context.setData(CONTEXT_DATA_KEYS.selectedOffice, selectedOffice);
};
