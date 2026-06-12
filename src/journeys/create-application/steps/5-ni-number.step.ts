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
import { t } from "#/lib/i18n.js";

export const niNumberStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/create-application/client-details",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKRadioInput({
        code: "hasNINumber",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: t("journeys.createApplication.niNumber.title"),
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
              label: t("journeys.createApplication.niNumber.label"),
              validWhen: [
                validation({
                  condition: Self().match(Condition.IsRequired()),
                  message: t(
                    "journeys.createApplication.niNumber.validation.required",
                  ),
                }),
                validation({
                  condition: Self().match(
                    Condition.String.MatchesRegex(
                      "^(?!BG|GB|KN|NK|NT|TN|ZZ)[^DFIQUV][^DFIQUVo][0-9]{6}[ABCD]$",
                    ),
                  ),
                  message: t(
                    "journeys.createApplication.niNumber.validation.invalid",
                  ),
                }),
              ],
            }),
            text: t("common.yes"),
            value: "yes",
          },
          {
            text: t("common.no"),
            value: "no",
          },
        ],
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.niNumber.validation.hasNIRequired",
            ),
          }),
        ],
      }),
      GovUKButton({ text: t("common.continue") }),
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
            redirect({ goto: "have-a-home-address" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/ni-number",
    reachability: { entryWhen:Query("returnTo").match(Condition.Equals("check-answers")) },
    title: t("journeys.createApplication.niNumber.title"),
  });
