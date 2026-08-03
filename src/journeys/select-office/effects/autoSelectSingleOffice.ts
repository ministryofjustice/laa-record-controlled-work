import type {
  Office,
  SelectOfficeContext,
} from "#/journeys/select-office/select-office.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { MissingSessionError } from "#/journeys/journey.errors.js";

const SINGLE_OFFICE = 1;

export const autoSelectSingleOffice = () => (context: SelectOfficeContext) => {
  const officeList = context.getData<Office[]>(CONTEXT_DATA_KEYS.officeList);
  const session = context.getSession();

  if (!session) {
    throw new MissingSessionError();
  }

  if (officeList.length !== SINGLE_OFFICE) {
    session.singleOffice = false;
    return;
  }

  const [office] = officeList;

  session.selectedOffice = office;
  session.singleOffice = true;
  context.setData(CONTEXT_DATA_KEYS.selectedOffice, office);
};
