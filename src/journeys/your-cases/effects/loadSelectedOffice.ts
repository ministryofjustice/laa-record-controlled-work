import type { CaseListContext } from "#/journeys/your-cases/your-cases.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { SelectedOfficeNotFoundError } from "#/journeys/journey.errors.js";
import { OfficeSchema } from "#/journeys/select-office/select-office.types.js";
import { logger } from "#/logger.js";

export const loadSelectedOffice = () => (context: CaseListContext) => {
  const session = context.getSession();
  const selectedOffice = session?.selectedOffice;

  if (selectedOffice === undefined) {
    return;
  }

  const result = OfficeSchema.safeParse(selectedOffice);
  if (!result.success) {
    logger.error("Selected office in session is invalid", result.error, {
      selectedOffice,
    });
    throw new SelectedOfficeNotFoundError(result.error);
  }

  context.setData(CONTEXT_DATA_KEYS.selectedOffice, result.data);
  context.setData(CONTEXT_DATA_KEYS.singleOffice, session?.singleOffice);
};
