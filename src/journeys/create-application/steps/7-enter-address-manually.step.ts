import {
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
import { t } from "#/lib/i18n.js";

export const enterAddressManuallyStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/create-application/have-a-home-address",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKHeading({
        text: t("journeys.createApplication.enterAddressManually.title"),
      }),
      GovUKTextInput({
        code: "addressLine1",
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterAddressManually.addressLine1.label",
          ),
        },
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.enterAddressManually.addressLine1.validation.required",
            ),
          }),
        ],
      }),
      GovUKTextInput({
        code: "addressLine2",
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterAddressManually.addressLine2.label",
          ),
        },
      }),
      GovUKTextInput({
        classes: "govuk-!-width-two-thirds",
        code: "townOrCity",
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterAddressManually.townOrCity.label",
          ),
        },
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.enterAddressManually.townOrCity.validation.required",
            ),
          }),
        ],
      }),
      GovUKTextInput({
        classes: "govuk-!-width-two-thirds",
        code: "county",
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterAddressManually.county.label",
          ),
        },
      }),
      GovUKTextInput({
        classes: "govuk-input--width-10",
        code: "postcode",
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterAddressManually.postcode.label",
          ),
        },
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.enterAddressManually.postcode.validation.required",
            ),
          }),
        ],
      }),
      HtmlBlock({
        content: `<p class="govuk-body"><a class="govuk-link" href="/enter-overseas-address">${t("journeys.createApplication.enterAddressManually.nonUkAddress")}</a></p>`,
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
    path: "/enter-address-manually",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.createApplication.enterAddressManually.title"),
  });
