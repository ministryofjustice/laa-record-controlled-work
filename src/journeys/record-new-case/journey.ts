import { PatternEffects } from "#/journeys/effects.js";
import {
  journey,
  step,
  submit,
  redirect,
  Answer,
  Condition,
  validation,
  Self,
  access,
  Query,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKButton,
  GovUKRadioInput,
  GovUKHeading,
  GovUKBody,
  GovUKBackLink,
} from "@ministryofjustice/hmpps-forge/govuk-components";

const patternCode = "newCase";

const ecfStep = step({
  path: "/ecf",
  title: "Does this case require Exceptional Case Funding?",
  reachability: { entryWhen: true },
  blocks: [
    GovUKBackLink({
      href: "/",
    }),
    HtmlBlock({
      content: '<span class="govuk-caption-l">Client and case details</span>',
    }),
    GovUKRadioInput({
      code: "ecf",
      fieldset: {
        legend: {
          text: "Does this case require Exceptional Case Funding?",
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l",
        },
      },
      items: [
        {
          value: "yes",
          text: "Yes",
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
        effects: [PatternEffects.SaveDraftAnswers(patternCode)],
        next: [
          redirect({
            when: Query("returnTo").match(Condition.Equals("check-answers")),
            goto: "check-answers",
          }),
          redirect({
            when: Answer("ecf").match(Condition.Equals("yes")),
            goto: "ecf-dropout",
          }),
          redirect({ goto: "legal-aid-before" }),
        ],
      },
    }),
  ],
});

const ineligibleStep = step({
  path: "/ecf-dropout",
  title: "You are ineligible",
  blocks: [
    GovUKBackLink({
      href: "/new-case/ecf",
    }),
    GovUKHeading({
      text: "You cannot use this service for this type of case",
      level: 1,
    }),
    GovUKBody({
      text: 'Continue to complete the <a href="/government/publications/legal-aid-exceptional-case-funding-form-and-guidance">ECF application form CIV ECF 1</a> and <a href="/government/publications/cw1-financial-eligibility-for-legal-aid-clients">form CW1</a> for your client.',
    }),
    GovUKBody({
      text: 'Send completed forms to: <a href="mailto:contactECC@justice.gov.uk">contactECC@justice.gov.uk</a>',
    }),
    GovUKButton({
      text: "Return to case list",
    }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [PatternEffects.ClearDraftAnswers(patternCode)],
        next: [
          redirect({ goto: "/" }),
        ],
      },
    }),
  ],
});

export const newCaseJourney = journey({
  code: "newCase",
  title: "Record new case",
  path: "/new-case",
  onAccess: [
    access({
      effects: [PatternEffects.LoadDraftAnswers(patternCode)],
    }),
  ],
  reachability: { disableReachabilityChecks: false },
  view: { template: "partials/form-step" },
  steps: [ecfStep, ineligibleStep],
});
