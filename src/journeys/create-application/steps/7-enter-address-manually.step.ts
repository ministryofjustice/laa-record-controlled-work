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
import {
  OVERSEAS_ADDRESS_FIELDS,
  UK_ADDRESS_FIELD,
} from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18nLoader.js";

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
        code: UK_ADDRESS_FIELD.addressLine1,
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
        code: UK_ADDRESS_FIELD.addressLine2,
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterAddressManually.addressLine2.label",
          ),
        },
      }),
      GovUKTextInput({
        classes: "govuk-!-width-two-thirds",
        code: UK_ADDRESS_FIELD.townOrCity,
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
        code: UK_ADDRESS_FIELD.county,
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterAddressManually.county.label",
          ),
        },
      }),
      GovUKTextInput({
        classes: "govuk-input--width-10",
        code: UK_ADDRESS_FIELD.postcode,
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
        content: `<p class="govuk-body"><a class="govuk-link" href="/create-application/enter-overseas-address">${t("journeys.createApplication.enterAddressManually.nonUkAddress")}</a></p>`,
      }),
      GovUKButton({ text: t("common.continue") }),
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [
            JourneyEffects.ClearFieldAnswers(
              journeyCode,
              OVERSEAS_ADDRESS_FIELDS,
            ),
            JourneyEffects.SaveDraftAnswers(journeyCode),
          ],
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
    title: t("journeys.createApplication.enterAddressManually.title"),
  });
