import {
  Condition,
  Query,
  redirect,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { StepCode } from "#/journeys/StepCode.enum.js";

export const redirectToCheckAnswers = redirect({
  goto: StepCode.CHECK_ANSWERS,
  when: Query("returnTo").match(Condition.Equals(StepCode.CHECK_ANSWERS)),
});
