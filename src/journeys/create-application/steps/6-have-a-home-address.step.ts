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

import { JourneyEffects } from "#/journeys/effects.js";

export const haveAHomeAddressStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/new-case/ni-number",
      }),
      HtmlBlock({
        content: '<span class="govuk-caption-l">Client and case details</span>',
      }),
      GovUKRadioInput({
        code: "haveAHomeAddress",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: "Does your client have a home address?",
          },
        },
        hint: {
          text: "The home address is the place that they normally live in, and sometimes called the main dwelling.",
        },
        items: [
          {
            text: "Yes",
            value: "yes",
          },
          {
            text: "No, they have no fixed address",
            value: "no",
          },
        ],
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: "Select if your client has a home address",
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
            redirect({
              goto: "enter-address-manually",
              when: Answer("haveAHomeAddress").match(Condition.Equals("yes")),
            }),
            redirect({
              goto: "need-means-assessment",
              when: Answer("haveAHomeAddress").match(Condition.Equals("no")),
            }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/have-a-home-address",
    title: "Does your client have a home address?",
  });
