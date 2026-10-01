import type { GovUKTextInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";

import { UK_ADDRESS_FIELDS } from "#/journeys/journey.constants.js";
import { textInput } from "#/journeys/shared.blocks.js";
import { required } from "#/journeys/validation.js";
import { fixedT } from "#/lib/i18n.js";

const t = fixedT("journeys.createApplication.enterAddressManually");

interface AddressField {
  code: string;
  invalidValidation?: string;
  label: string;
  requiredValidation?: string;
}

const line1 = {
  code: UK_ADDRESS_FIELDS.addressLine1,
  label: t("addressLine1.label"),
  requiredValidation: t("addressLine1.validation.required"),
} satisfies AddressField;

const line2 = {
  code: UK_ADDRESS_FIELDS.addressLine2,
  label: t("addressLine2.label"),
} satisfies AddressField;

const townOrCity = {
  code: UK_ADDRESS_FIELDS.townOrCity,
  label: t("townOrCity.label"),
  requiredValidation: t("townOrCity.validation.required"),
} satisfies AddressField;

const county = {
  code: UK_ADDRESS_FIELDS.county,
  label: t("county.label"),
} satisfies AddressField;

const country = {
  code: UK_ADDRESS_FIELDS.country,
  label: "",
} satisfies AddressField;

const postcode = {
  code: UK_ADDRESS_FIELDS.postcode,
  invalidValidation: t("postcode.validation.invalid"),
  label: t("postcode.label"),
  requiredValidation: t("postcode.validation.required"),
} satisfies AddressField;

/**
 * Creates the form blocks for entering a UK address manually.
 *
 * @returns The address fields, overseas-address link, and continue button.
 */
export function manualAddressInputs(): GovUKTextInput[] {
  const addressLine1 = textInput(line1.code, line1.label, {
    validations: [required(line1.requiredValidation)],
  });
  const addressLine2 = textInput(line2.code, line2.label);
  const townOrCityInput = textInput(townOrCity.code, townOrCity.label, {
    classes: "govuk-!-width-two-thirds",
    validations: [required(townOrCity.requiredValidation)],
  });
  const countyInput = textInput(county.code, county.label, {
    classes: "govuk-!-width-two-thirds",
  });
  const postcodeInput = textInput(postcode.code, postcode.label, {
    classes: "govuk-input--width-10",
    validations: [
      required(postcode.requiredValidation),
      validation({
        condition: Self().match(Condition.Address.IsValidPostcode()),
        message: postcode.invalidValidation,
      }),
    ],
  });
  const countryInput = textInput(country.code, country.label, {
    classes:
      "govuk-input--width-10 govuk-!-display-none govuk-!-visibility-hidden",
    defaultValue: "United Kingdom",
  });

  return [
    addressLine1,
    addressLine2,
    townOrCityInput,
    countyInput,
    postcodeInput,
    countryInput,
  ];
}

/**
 * Creates a link to the overseas-address form.
 *
 * @returns The overseas-address link block.
 */
export function nonUkAddressLinkBlock(): HtmlBlock {
  return HtmlBlock({
    content: `<p class="govuk-body"><a class="govuk-link" href="enter-overseas-address">${t("journeys.createApplication.enterAddressManually.nonUkAddress")}</a></p>`,
  });
}
