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

import { AccessibleAutocomplete } from "#/components/accessibleAutocomplete/accessibleAutocomplete.component.js";
import { JourneyEffects } from "#/journeys/effects.js";
import {
  ADDRESS_FIELD,
  countries,
  UK_EXCLUSIVE_ADDRESS_FIELDS,
} from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18nLoader.js";

const MINIMUM_AUTOCOMPLETE_CHARACTERS = 2;

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
      AccessibleAutocomplete({
        data: countries,
        field: GovUKTextInput({
          classes: "govuk-!-width-two-thirds",
          code: ADDRESS_FIELD.country,
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
        minLength: MINIMUM_AUTOCOMPLETE_CHARACTERS,
        showAllValues: false,
        showNoOptionsFound: true,
      }),
      GovUKHeading({
        classes: "govuk-label--m",
        text: t(
          "journeys.createApplication.enterOverseasAddress.address.title",
        ),
      }),
      GovUKTextInput({
        code: ADDRESS_FIELD.addressLine1,
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
        code: ADDRESS_FIELD.addressLine2,
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterOverseasAddress.address.line2.label",
          ),
        },
      }),
      GovUKTextInput({
        code: ADDRESS_FIELD.addressLine3,
        label: {
          isPageHeading: false,
          text: t(
            "journeys.createApplication.enterOverseasAddress.address.line3.label",
          ),
        },
      }),
      GovUKTextInput({
        code: ADDRESS_FIELD.addressLine4,
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
          effects: [
            JourneyEffects.ClearFieldAnswers(
              journeyCode,
              UK_EXCLUSIVE_ADDRESS_FIELDS,
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
    path: "/enter-overseas-address",
    reachability: {
      entryWhen: Answer("haveAHomeAddress").match(Condition.Equals("yes")),
    },
    title: t("journeys.createApplication.enterOverseasAddress.title"),
  });
