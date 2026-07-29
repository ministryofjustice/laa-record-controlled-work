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

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { t } from "#/lib/i18n.js";

export const legalAidBeforeStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/cases/new/ecf",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKRadioInput({
        code: "legalAidBefore",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: t("journeys.createApplication.legalAidBefore.title"),
          },
        },
        items: [
          {
            text: t(
              "journeys.createApplication.legalAidBefore.radioButton.yesSameMatter",
            ),
            value: "yesSameMatter",
          },
          {
            text: t(
              "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
            ),
            value: "yesDifferentMatter",
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
              "journeys.createApplication.legalAidBefore.validation.required",
            ),
          }),
        ],
      }),
      GovUKButton({ text: t("common.continue") }),
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({
              goto: "legal-aid-last-6-months",
              when: Answer("legalAidBefore").match(
                Condition.Equals("yesSameMatter"),
              ),
            }),
            redirect({ goto: "client-details" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/legal-aid-before",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.createApplication.legalAidBefore.title"),
  });
