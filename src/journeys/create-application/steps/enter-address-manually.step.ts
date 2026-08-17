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

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  ADDRESS_FIELD,
  OVERSEAS_EXCLUSIVE_ADDRESS_FIELDS,
} from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

export const enterAddressManuallyStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/cases/new/have-a-home-address",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKHeading({
        text: t("journeys.createApplication.enterAddressManually.title"),
      }),
      GovUKTextInput({
        code: ADDRESS_FIELD.addressLine1,
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
        code: ADDRESS_FIELD.addressLine2,
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterAddressManually.addressLine2.label",
          ),
        },
      }),
      GovUKTextInput({
        classes: "govuk-!-width-two-thirds",
        code: ADDRESS_FIELD.townOrCity,
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
        code: ADDRESS_FIELD.county,
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterAddressManually.county.label",
          ),
        },
      }),
      GovUKTextInput({
        classes: "govuk-input--width-10",
        code: ADDRESS_FIELD.postcode,
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
          validation({
            condition: Self().match(Condition.Address.IsValidPostcode()),
            message: t(
              "journeys.createApplication.enterAddressManually.postcode.validation.invalid",
            ),
          }),
        ],
      }),
      GovUKTextInput({
        classes:
          "govuk-input--width-10 govuk-!-display-none govuk-!-visibility-hidden",
        code: ADDRESS_FIELD.country,
        defaultValue: "United Kingdom",
        label: {
          isPageHeading: false,
          text: "",
        },
      }),
      HtmlBlock({
        content: `<p class="govuk-body"><a class="govuk-link" href="/cases/new/enter-overseas-address">${t("journeys.createApplication.enterAddressManually.nonUkAddress")}</a></p>`,
      }),
      GovUKButton({ text: t("common.continue") }),
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [
            CreateApplicationEffects.clearFieldAnswers(
              journeyCode,
              OVERSEAS_EXCLUSIVE_ADDRESS_FIELDS,
            ),
            CreateApplicationEffects.saveDraftAnswers(journeyCode),
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
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.createApplication.enterAddressManually.title"),
  });
