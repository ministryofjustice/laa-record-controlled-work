import type { CaseListContext } from "#/journeys/your-cases/your-cases.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export const setSelectedOffice = () => (context: CaseListContext) => {
  const selectedOffice = {
    address: "123 Fake Street",
    code: "A123456",
    displayName: "London Office",
  };

  context.setData(CONTEXT_DATA_KEYS.selectedOffice, selectedOffice);
  context.setData(CONTEXT_DATA_KEYS.singleOffice, false);
};
