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

import { PatternEffects } from "#/journeys/effects.js";
const patternCode = "createApplication";

export const ecfStep = step({
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