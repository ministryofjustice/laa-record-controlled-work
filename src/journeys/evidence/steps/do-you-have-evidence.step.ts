import {
  Condition,
  Query,
  redirect,
  Self,
  step,
  submit,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBackLink,
  GovUKButton,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "i18next";

import { JourneyEffects } from "#/journeys/effects.js";

export const doYouHaveEvidence = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/task-list",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.evidence.caption")}</span>`,
      }),
      GovUKRadioInput({
        code: "doYouHaveEvidence",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: t("journeys.evidence.doYouHaveEvidence.title"),
          },
        },
        items: [
          {
            text: t("common.yes"),
            value: "yes",
          },
          {
            text: t("common.no"),
            value: "no",
          },
        ],
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.evidence.doYouHaveEvidence.validation.required",
            ),
          }),
        ],
      }),
      GovUKButton({ text: t("common.continue") }),
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({
              goto: "evidence-of-income",
              when: Query("doYouHaveEvidence").match(Condition.Equals("yes")),
            }),
            redirect({ goto: "reason-for-no-evidence" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/have-evidence",
    reachability: { entryWhen: true },
    title: t("journeys.evidence.doYouHaveEvidence.title"),
  });
