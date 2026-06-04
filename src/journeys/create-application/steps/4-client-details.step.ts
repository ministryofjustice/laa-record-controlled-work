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
  GovUKDateInputFull,
  GovUKHeading,
  GovUKTextInput,
  GovUKUtilityClasses,
  GovUKValidations,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { JourneyEffects } from "#/journeys/effects.js";

export const clientDetailsStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/create-application/legal-aid-before",
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
          classes: "govuk-label--m",
          isPageHeading: false,
          text: "Full name",
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
            classes: GovUKUtilityClasses.Fieldset.MediumLabel,
            isPageHeading: false,
            text: "Date of birth",
          },
        },
        hint: {
          text: "For example, 31 3 1980",
        },
        validWhen: [
          ...GovUKValidations.DateInputFull({
            empty: { message: "Enter your client's date of birth" },
            invalid: { message: "Date of birth must be a real date" },
            missingDay: { message: "Date of birth must include a day" },
            missingMonth: { message: "Date of birth must include a month" },
            missingYear: { message: "Date of birth must include a year" },
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
        onValid: {
          effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({ goto: "ni-number" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/client-details",
    title: "Your client's details",
  });
