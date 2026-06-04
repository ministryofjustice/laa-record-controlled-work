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

export const legalAidBeforeStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/create-application/ecf",
      }),
      HtmlBlock({
        content: '<span class="govuk-caption-l">Client and case details</span>',
      }),
      GovUKRadioInput({
        code: "legalAidBefore",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: "Has your client accessed legal aid before?",
          },
        },
        items: [
          {
            text: "Yes, about the same matter",
            value: "yesSameMatter",
          },
          {
            text: "Yes, about a different matter",
            value: "yesDifferentMatter",
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
          effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({
              goto: "legal-aid-last-6-months",
              when: Answer("legalAidBefore").match(
                Condition.Equals("yesSameMatter"),
              ),
            }),
            redirect({ goto: "client-details" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/legal-aid-before",
    title: "Has your client accessed legal aid before?",
  });
