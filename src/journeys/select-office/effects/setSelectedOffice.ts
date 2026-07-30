import type {
  Office,
  SelectOfficeContext,
} from "#/journeys/select-office/select-office.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { MissingSessionError } from "#/journeys/journey.errors.js";

export const setSelectedOffice = () => (context: SelectOfficeContext) => {
  const selectedOffice: Office = context.getAnswer("selectOffice");

  const session = context.getSession();

  if (!session) {
    throw new MissingSessionError();
  }

  session.selectedOffice = selectedOffice;

  context.setData(CONTEXT_DATA_KEYS.selectedOffice, selectedOffice);
};
