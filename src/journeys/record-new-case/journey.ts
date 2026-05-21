import {
  access,
  Answer,
  Condition,
  journey,
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
  GovUKBody,
  GovUKButton,
  GovUKHeading,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { PatternEffects } from "#/journeys/effects.js";

const patternCode = "newCase";

const ecfStep = step({
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
          classes: "govuk-fieldset__legend--l",
          isPageHeading: true,
          text: "Does this case require Exceptional Case Funding?",
        },
      },
      items: [
        {
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
          message: "Please select an option",
        }),
      ],
    }),
    GovUKButton({ text: "Continue" }),
  ],
  onSubmission: [
    submit({
      onValid: {
        effects: [PatternEffects.SaveDraftAnswers(patternCode)],
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
  title: "Does this case require Exceptional Case Funding?",
});

const ineligibleStep = step({
  blocks: [
    GovUKBackLink({
      href: "/new-case/ecf",
    }),
    GovUKHeading({
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- this is not a magic number
      level: 1,
      text: "You cannot use this service for this type of case",
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
      onValid: {
        effects: [PatternEffects.ClearDraftAnswers(patternCode)],
        next: [redirect({ goto: "/" })],
      },
      validate: true,
    }),
  ],
  path: "/ecf-dropout",
  title: "You are ineligible",
});

export const newCaseJourney = journey({
  code: "newCase",
  onAccess: [
    access({
      effects: [PatternEffects.LoadDraftAnswers(patternCode)],
    }),
  ],
  path: "/new-case",
  reachability: { disableReachabilityChecks: false },
  steps: [ecfStep, ineligibleStep],
  title: "Record new case",
  view: { template: "partials/form-step" },
});
