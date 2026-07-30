import type { CaseListContext } from "#/journeys/your-cases/your-cases.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { OfficeSchema } from "#/journeys/select-office/select-office.types.js";
import { logger } from "#/logger.js";

export const loadSelectedOffice = () => (context: CaseListContext) => {
  const session = context.getSession();
  const selectedOffice = session?.selectedOffice;
  const result = OfficeSchema.safeParse(selectedOffice);
  if (!result.success) {
    logger.error("Selected office in session is invalid", result.error, {
      selectedOffice,
    });
    // TODO new error
    throw new Error(
      `Selected office in session is invalid: ${result.error.message}`,
    );
  }

  context.setData(CONTEXT_DATA_KEYS.selectedOffice, result.data);
};
