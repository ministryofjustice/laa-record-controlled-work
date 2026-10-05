import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
export const getJourneyDraftKey = (
  context: Pick<EffectFunctionContext, "getRequestParam">,
  journeyCode: string,
): string => {
  const applicationID = context.getRequestParam(PARAMS_KEYS.applicationID);

  return applicationID ? `${journeyCode}:${applicationID}` : journeyCode;
};
