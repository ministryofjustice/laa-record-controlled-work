import type { CaseListContext } from "#/journeys/your-cases/your-cases.types.js";

import { OfficeSchema } from "#/dto/office/office.dto.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  InvalidSelectedOfficeError,
  InvalidSessionError,
} from "#/journeys/journey.errors.js";
import { logger } from "#/logger.js";

export const loadSelectedOffice = () => (context: CaseListContext) => {
  const session = context.getSession();
  if (!session) {
    throw new InvalidSessionError();
  }
  const { selectedOffice } = session;

  if (selectedOffice === undefined) {
    return;
  }

  const result = OfficeSchema.safeParse(selectedOffice);
  if (!result.success) {
    logger.error("Selected office in session is invalid", result.error, {
      selectedOffice,
    });
    throw new InvalidSelectedOfficeError(result.error);
  }

  context.setData(CONTEXT_DATA_KEYS.selectedOffice, result.data);
  context.setData(CONTEXT_DATA_KEYS.singleOffice, session.singleOffice);
};
