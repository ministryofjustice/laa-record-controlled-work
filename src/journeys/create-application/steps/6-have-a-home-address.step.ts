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
import { t } from "#/lib/i18n.js";

export const haveAHomeAddressStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/create-application/ni-number",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKRadioInput({
        code: "haveAHomeAddress",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: t("journeys.createApplication.haveAHomeAddress.title"),
          },
        },
        hint: {
          text: t("journeys.createApplication.haveAHomeAddress.hint"),
        },
        items: [
          {
            text: t("common.yes"),
            value: "yes",
          },
          {
            text: t(
              "journeys.createApplication.haveAHomeAddress.radioButton.no",
            ),
            value: "no",
          },
        ],
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.haveAHomeAddress.validation.required",
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
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.createApplication.haveAHomeAddress.title"),
  });
