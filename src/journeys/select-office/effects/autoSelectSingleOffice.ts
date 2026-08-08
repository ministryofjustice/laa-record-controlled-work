import type { SelectOfficeContext } from "#/journeys/select-office/select-office.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { InvalidSessionError } from "#/journeys/journey.errors.js";

const SINGLE_OFFICE = 1;

export const autoSelectSingleOffice = () => (context: SelectOfficeContext) => {
  const availableOffices = context.getData(CONTEXT_DATA_KEYS.availableOffices);
  const session = context.getSession();

  if (!session) {
    throw new InvalidSessionError();
  }

  if (availableOffices.length !== SINGLE_OFFICE) {
    session.singleOffice = false;
    return;
  }

  const [autoSelectedOffice] = availableOffices;

  session.selectedOffice = autoSelectedOffice;
  session.singleOffice = true;
  context.setData(CONTEXT_DATA_KEYS.selectedOffice, autoSelectedOffice);
};
