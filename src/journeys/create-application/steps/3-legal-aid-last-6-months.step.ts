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
  GovUKCharacterCount,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { JourneyEffects } from "#/journeys/effects.js";
import { t } from "#/lib/i18n.js";

const REASON_MAX_LENGTH = 500;

export const legalAidLast6MonthsStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/create-application/legal-aid-before",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKRadioInput({
        code: "legalAidLast6Months",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: t("journeys.createApplication.legalAidLast6Months.title"),
          },
        },
        items: [
          {
            block: GovUKCharacterCount({
              code: "reasonForYes",
              dependentWhen: Answer("legalAidLast6Months").match(
                Condition.Equals("yes"),
              ),
              label: t(
                "journeys.createApplication.legalAidLast6Months.reasonForYes.hint",
              ),
              maxLength: REASON_MAX_LENGTH,
              validWhen: [
                validation({
                  condition: Self().match(Condition.IsRequired()),
                  message: t(
                    "journeys.createApplication.legalAidLast6Months.validation.reasonRequired",
                  ),
                }),
              ],
            }),
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
              "journeys.createApplication.legalAidLast6Months.validation.required",
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
            redirect({ goto: "client-details" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/legal-aid-last-6-months",
    title: t("journeys.createApplication.legalAidLast6Months.title"),
  });
