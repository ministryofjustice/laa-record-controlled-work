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
} from "@ministryofjustice/hmpps-forge/govuk-components";

export const legalAidBeforeStep= (journeyCode: string): ReturnType<typeof step> => step({
  path: "/legal-aid-before",
  title: "Has your client accessed legal aid before?",
  blocks: [
    GovUKBackLink({
      href: "/new-case/ecf",
    }),
    HtmlBlock({
      content: '<span class="govuk-caption-l">Client and case details</span>',
    }),
    GovUKRadioInput({
      code: "legalAidBefore",
      fieldset: {
        legend: {
          text: "Has your client accessed legal aid before?",
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l",
        },
      },
      items: [
        {
          value: "yesSameMatter",
          text: "Yes, about the same matter",
        },
        {
          value: "yesDifferentMatter",
          text: "Yes, about a different matter",
        },
        {
          value: "no",
          text: "No",
        },
      ],
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Please select an option",
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
          redirect({
            when: Answer("legalAidBefore").match(
              Condition.Equals("yesSameMatter"),
            ),
            goto: "legal-aid-last-6-months",
          }),
          redirect({ goto: "client-details" }),
        ],
      },
    }),
  ],
});