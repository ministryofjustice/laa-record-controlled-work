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
  GovUKHeading,
  GovUKTextInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { JourneyEffects } from "#/journeys/effects.js";
import { t } from "#/lib/i18nLoader.js";

export const enterOverseasAddressStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/create-application/enter-address-manually",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKHeading({
        text: t("journeys.createApplication.enterOverseasAddress.title"),
      }),
      GovUKTextInput({
        classes: "govuk-!-width-two-thirds govuk-label--m",
        code: "country",
        label: {
          classes: "govuk-label--m",
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterOverseasAddress.country.label",
          ),
        },
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.enterOverseasAddress.country.validation.required",
            ),
          }),
        ],
      }),
      GovUKHeading({
        classes: "govuk-label--m",
        text: t(
          "journeys.createApplication.enterOverseasAddress.address.title",
        ),
      }),
      GovUKTextInput({
        code: "addressLine1",
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterOverseasAddress.address.line1.label",
          ),
        },
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.enterOverseasAddress.address.line1.validation.required",
            ),
          }),
        ],
      }),
      GovUKTextInput({
        code: "addressLine2",
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterOverseasAddress.address.line2.label",
          ),
        },
      }),
      GovUKTextInput({
        code: "addressLine3",
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterOverseasAddress.address.line3.label",
          ),
        },
      }),
      GovUKTextInput({
        code: "addressLine4",
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterOverseasAddress.address.line4.label",
          ),
        },
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
            redirect({ goto: "check-answers" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/enter-overseas-address",
    reachability: {
      entryWhen: Answer("haveAHomeAddress").match(Condition.Equals("yes")),
    },
    title: t("journeys.createApplication.enterOverseasAddress.title"),
  });
