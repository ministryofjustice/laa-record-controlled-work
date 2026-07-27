import {
  Answer,
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

import { JourneyEffects } from "#/journeys/effects.js";
import { t } from "#/lib/i18n.js";

export const ecfStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/cases/new/provider-declaration",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKRadioInput({
        code: "ecf",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: t("journeys.createApplication.ecf.title"),
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
            message: t("journeys.createApplication.ecf.validation.required"),
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
              goto: "ecf-dropout",
              when: Answer("ecf").match(Condition.Equals("yes")),
            }),
            redirect({ goto: "legal-aid-before" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/ecf",
    reachability: { entryWhen: true },
    title: t("journeys.createApplication.ecf.title"),
  });
