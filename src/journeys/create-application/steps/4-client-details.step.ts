import { JourneyEffects } from "#/journeys/effects.js";
import {
  step,
  submit,
  redirect,
  Condition,
  validation,
  Self,
  Query,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKButton,
  GovUKHeading,
  GovUKBackLink,
  GovUKTextInput,
  GovUKDateInputFull,
  GovUKUtilityClasses,
  GovUKValidations,
} from "@ministryofjustice/hmpps-forge/govuk-components";

export const clientDetailsStep = (journeyCode: string): ReturnType<typeof step> => step({
  path: "/client-details",
  title: "Your client's details",
  blocks: [
    GovUKBackLink({
      href: "/new-case/legal-aid-before",
    }),
    HtmlBlock({
      content: '<span class="govuk-caption-l">Client and case details</span>',
    }),
    GovUKHeading({
      text: "Your client's details",
    }),
    GovUKTextInput({
      code: "fullName",
      label: {
        text: "Full name",
        isPageHeading: false,
        classes: "govuk-label--m",
      },
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Enter your client's name",
        }),
      ],
    }),
    GovUKDateInputFull({
      code: "dateOfBirth",
      fieldset: {
        legend: {
          text: "Date of birth",
          isPageHeading: false,
          classes: GovUKUtilityClasses.Fieldset.MediumLabel,
        },
      },
      hint: {
        text: "For example, 31 3 1980",
      },
      validWhen: [
        ...GovUKValidations.DateInputFull({
          empty: { message: "Enter your client'sdate of birth" },
          missingDay: { message: "Date of birth must include a day" },
          missingMonth: { message: "Date of birth must include a month" },
          missingYear: { message: "Date of birth must include a year" },
          invalid: { message: "Date of birth must be a real date" },
          mustBePast: {
            message: "Date of birth must be in the past",
            submissionOnly: true,
          },
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
          redirect({ goto: "check-answers" }),
        ],
      },
    }),
  ],
});
