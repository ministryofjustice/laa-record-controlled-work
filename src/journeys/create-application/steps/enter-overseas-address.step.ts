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
  GovUKButton,
  GovUKHeading,
  GovUKTextInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { Autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  ADDRESS_FIELD,
  UK_EXCLUSIVE_ADDRESS_FIELDS,
} from "#/journeys/journey.constants.js";
import { COUNTRY_NAMES } from "#/lib/countries.js";
import { t } from "#/lib/i18n.js";

const MINIMUM_AUTOCOMPLETE_CHARACTERS = 2;

export const enterOverseasAddressStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKHeading({
        text: t("journeys.createApplication.enterOverseasAddress.title"),
      }),
      Autocomplete({
        clearLinkText: t(
          "journeys.createApplication.enterOverseasAddress.country.clearButton",
        ),
        data: COUNTRY_NAMES,
        field: GovUKTextInput({
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
            CreateApplicationEffects.clearFieldAnswers(
              journeyCode,
              UK_EXCLUSIVE_ADDRESS_FIELDS,
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
    path: "/enter-overseas-address",
    reachability: {
      entryWhen: Answer("haveAHomeAddress").match(Condition.Equals("yes")),
    },
    title: t("journeys.createApplication.enterOverseasAddress.title"),
  });
