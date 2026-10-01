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

const addressT = fixedT("journeys.createApplication.enterAddressManually");

const line1 = {
  code: UK_ADDRESS_FIELDS.addressLine1,
  label: addressT("addressLine1.label"),
  requiredValidation: addressT("addressLine1.validation.required"),
};

const line2 = {
  code: UK_ADDRESS_FIELDS.addressLine2,
  label: addressT("addressLine2.label"),
};

const townOrCity = {
  code: UK_ADDRESS_FIELDS.townOrCity,
  label: addressT("townOrCity.label"),
  requiredValidation: addressT("townOrCity.validation.required"),
};

const county = {
  code: UK_ADDRESS_FIELDS.county,
  label: addressT("county.label"),
};

const country = {
  code: UK_ADDRESS_FIELDS.country,
  label: "",
};

const postcode = {
  code: UK_ADDRESS_FIELDS.postcode,
  invalidValidation: addressT("postcode.validation.invalid"),
  label: addressT("postcode.label"),
  requiredValidation: addressT("postcode.validation.required"),
};

/**
 * Creates the form blocks for entering a UK address manually.
 *
 * @returns The address fields
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
    content: `<p class="govuk-body"><a class="govuk-link" href="enter-overseas-address">${addressT("nonUkAddress")}</a></p>`,
  });
}
