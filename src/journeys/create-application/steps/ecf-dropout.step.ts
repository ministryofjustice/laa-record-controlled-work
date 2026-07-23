import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBackLink,
  GovUKBody,
  GovUKButton,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1 } from "#/lib/constants/headings.js";
import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";

export const ineligibleStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/cases/new/ecf",
      }),
      GovUKHeading({
        level: H1,
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
          effects: [CreateApplicationEffects.clearAllDraftAnswers(journeyCode)],
          next: [redirect({ goto: "/" })],
        },
        validate: true,
      }),
    ],
    path: "/ecf-dropout",
    title: "You are ineligible",
  });
