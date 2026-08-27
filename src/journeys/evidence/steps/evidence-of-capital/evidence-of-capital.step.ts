import {
  Condition,
  Format,
  Params,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  capitalEvidenceGroup,
  heading,
  label,
} from "#/journeys/evidence/steps/evidence-of-capital/evidence-of-capital.blocks.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { backLink, caption, continueButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

export const evidenceOfCapital = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink(
        Format(
          "/cases/%1/evidence/evidence-of-expenditure",
          Params(PARAMS_KEYS.applicationID),
        ),
      ),
      caption(t("journeys.evidence.caption")),
      heading,
      label,
      capitalEvidenceGroup,
      continueButton(),
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [evidenceEffects.saveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({ goto: "check-answers" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/evidence-of-capital",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.evidence.evidenceOfCapital.title"),
  });
