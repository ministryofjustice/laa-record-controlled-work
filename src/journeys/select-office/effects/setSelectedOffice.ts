import type { OfficeData } from "#/dto/office/office.dto.js";
import type { SelectOfficeContext } from "#/journeys/select-office/select-office.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  InvalidSelectedOfficeError,
  InvalidSessionError,
} from "#/journeys/journey.errors.js";
import { logger } from "#/logger.js";

export const setSelectedOffice = () => (context: SelectOfficeContext) => {
  const selectedOfficeCode = context.getAnswer("selectOffice");
  const availableOffices = context.getData(CONTEXT_DATA_KEYS.officeList);

  const selectedOffice: OfficeData | undefined = availableOffices.find(
    (office) => office.code === selectedOfficeCode,
  );

  if (!selectedOffice) {
    logger.error("Office not found", undefined, {
      officeCode: selectedOfficeCode,
    });
    throw new InvalidSelectedOfficeError();
  }

  const session = context.getSession();

  if (!session) {
    throw new InvalidSessionError();
  }

  session.selectedOffice = selectedOffice;

  context.setData(CONTEXT_DATA_KEYS.selectedOffice, selectedOffice);
};
