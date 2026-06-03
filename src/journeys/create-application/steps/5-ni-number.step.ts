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
  GovUKTextInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { JourneyEffects } from "#/journeys/effects.js";

export const niNumberStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/create-application/client-details",
      }),
      HtmlBlock({
        content: '<span class="govuk-caption-l">Client and case details</span>',
      }),
      GovUKRadioInput({
        code: "hasNINumber",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: "Does your client have a National Insurance number?",
          },
        },
        items: [
          {
            block: GovUKTextInput({
              classes: "govuk-input--width-10",
              code: "niNumber",
              dependentWhen: Answer("hasNINumber").match(
                Condition.Equals("yes"),
              ),
              label: "Enter your client's National Insurance number",
              validWhen: [
                validation({
                  condition: Self().match(Condition.IsRequired()),
                  message: "Enter your client's National Insurance number",
                }),
                validation({
                  condition: Self().match(
                    Condition.String.MatchesRegex(
                      "^(?!BG|GB|KN|NK|NT|TN|ZZ)[^DFIQUV][^DFIQUVo][0-9]{6}[ABCD]$",
                    ),
                  ),
                  message:
                    "Enter a National Insurance number that is 2 letters, 6 numbers, then A, B, C or D, like QQ 12 34 56 C",
                }),
              ],
            }),
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
            message: "Select if your client has a National Insurance number",
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
            redirect({ goto: "does-client-have-address" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/ni-number",
    title: "Does your client have a National Insurance number?",
  });
