import type {
  Office,
  SelectOfficeContext,
} from "#/journeys/select-office/select-office.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  InvalidSessionError,
  SelectedOfficeNotFoundError,
} from "#/journeys/journey.errors.js";
import { logger } from "#/logger.js";

export const setSelectedOffice = () => (context: SelectOfficeContext) => {
  const selectedOfficeCode = context.getAnswer("selectOffice");
  const officeList = context.getData<Office[]>(CONTEXT_DATA_KEYS.officeList);

  const selectedOffice: Office | undefined = officeList.find(
    (office) => office.code === selectedOfficeCode,
  );

  if (!selectedOffice) {
    logger.error("Office not found", undefined, {
      officeCode: selectedOfficeCode,
    });
    throw new SelectedOfficeNotFoundError();
  }

  const session = context.getSession();

  if (!session) {
    throw new InvalidSessionError();
  }

  session.selectedOffice = selectedOffice;

  context.setData(CONTEXT_DATA_KEYS.selectedOffice, selectedOffice);
};
