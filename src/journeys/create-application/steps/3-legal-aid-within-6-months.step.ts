import { JourneyEffects } from "#/journeys/effects.js";
import {
  step,
  submit,
  redirect,
  Answer,
  Condition,
  validation,
  Self,
  Query,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKButton,
  GovUKRadioInput,
  GovUKBackLink,
  GovUKCharacterCount,
} from "@ministryofjustice/hmpps-forge/govuk-components";

export const legalAidBefore6MonthsStep = (journeyCode: string): ReturnType<typeof step> => step({
  path: "/legal-aid-last-6-months",
  title: "Did your client get legal help for this matter in the last 6 months?",
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
          text: "Did your client get legal help for this matter in the last 6 months?",
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l",
        },
      },
      items: [
        {
          value: "yes",
          text: "Yes",
          block: GovUKCharacterCount({
            code: "reasonForYes",
            label:
              "Explain the reason for creating a new case for the same matter",
            /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- this is the max character length for the reason field */
            maxLength: 500,
            dependentWhen: Answer("legalAidLast6Months").match(
              Condition.Equals("yes"),
            ),
            validWhen: [
              validation({
                condition: Self().match(Condition.IsRequired()),
                message:
                  "Enter the reason you’re creating a new case for the same matter",
              }),
            ],
          }),
        },
        {
          value: "no",
          text: "No",
        },
      ],
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Select if your client got legal help for this matter in the last 6 months",
        }),
      ],
    }),
    GovUKButton({ text: "Continue" }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
        next: [
          redirect({
            when: Query("returnTo").match(Condition.Equals("check-answers")),
            goto: "check-answers",
          }),
          redirect({ goto: "client-details" }),
        ],
      },
    }),
  ],
});