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

export const legalAidBefore6MonthsStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/new-case/legal-aid-before",
      }),
      HtmlBlock({
        content: '<span class="govuk-caption-l">Client and case details</span>',
      }),
      GovUKRadioInput({
        code: "legalAidLast6Months",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: "Did your client get legal help for this matter in the last 6 months?",
          },
        },
        items: [
          {
            block: GovUKCharacterCount({
              code: "reasonForYes",
              dependentWhen: Answer("legalAidLast6Months").match(
                Condition.Equals("yes"),
              ),
              label:
                "Explain the reason for creating a new case for the same matter",
              /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- this is the max character length for the reason field */
              maxLength: 500,
              validWhen: [
                validation({
                  condition: Self().match(Condition.IsRequired()),
                  message:
                    "Enter the reason you're creating a new case for the same matter",
                }),
              ],
            }),
            text: "Yes",
            value: "yes",
          },
          {
            text: "No",
            value: "no",
          },
        ],
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message:
              "Select if your client got legal help for this matter in the last 6 months",
          }),
        ],
      }),
      GovUKButton({ text: "Continue" }),
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
    title:
      "Did your client get legal help for this matter in the last 6 months?",
  });
