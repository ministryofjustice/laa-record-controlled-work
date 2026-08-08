import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { Status } from "#/journeys/journey.types.js";

const EMPTY_STRING_LENGTH = 0;

export const setTaskListStatuses =
  () =>
  (context: EditApplicationContext): void => {
    const application = context.getData(CONTEXT_DATA_KEYS.application);
    const { address } = application.clientDetails;

    const hasClientDetailsData = [
      application.clientDetails.firstName,
      application.clientDetails.lastName,
      application.clientDetails.dateOfBirth,
      application.clientDetails.niNumber,
      address?.addressLine1,
      address?.addressLine2,
      address?.addressLine3,
      address?.addressLine4,
      address?.townOrCity,
      address?.postCode,
      address?.county,
      address?.country,
    ].some((value): boolean => {
      if (typeof value === "string") {
        return value.length > EMPTY_STRING_LENGTH;
      }

      return false;
    });

    const clientDetailsStatus = hasClientDetailsData
      ? Status.COMPLETED
      : Status.INCOMPLETE;

    context.setData(CONTEXT_DATA_KEYS.clientDetailsStatus, clientDetailsStatus);
  };
