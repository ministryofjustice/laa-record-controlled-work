import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";

const editClientDetailsJourneyCode: string = JourneyCode.EDIT_CLIENT_DETAILS;

export const getJourneyDraftKey = (
  context: Pick<EffectFunctionContext, "getRequestParam">,
  journeyCode: string,
): string => {
  if (journeyCode !== editClientDetailsJourneyCode) {
    return journeyCode;
  }

  const applicationID = context.getRequestParam(PARAMS_KEYS.applicationID);

  return applicationID ? `${journeyCode}:${applicationID}` : journeyCode;
};
