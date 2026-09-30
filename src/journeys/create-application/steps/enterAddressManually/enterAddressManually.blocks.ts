import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  type BlockDefinition,
  HtmlBlock,
} from "@ministryofjustice/hmpps-forge/core/components";

import { UK_ADDRESS_FIELDS } from "#/journeys/journey.constants.js";
import { textInput } from "#/journeys/shared.blocks.js";
import { answerIsRequired } from "#/journeys/shared.hook.js";
import { t } from "#/lib/i18n.js";

const LINE_1_CODE = UK_ADDRESS_FIELDS.addressLine1;
const LINE_1_LABEL = t(
  "journeys.createApplication.enterAddressManually.addressLine1.label",
);
const LINE_1_VALIDATION = t(
  "journeys.createApplication.enterAddressManually.addressLine1.validation.required",
);
const LINE_2_CODE = UK_ADDRESS_FIELDS.addressLine2;
const LINE_2_LABEL = t(
  "journeys.createApplication.enterAddressManually.addressLine2.label",
);

const TOWN_CITY_CODE = UK_ADDRESS_FIELDS.townOrCity;
const TOWN_CITY_LABEL = t(
  "journeys.createApplication.enterAddressManually.townOrCity.label",
);
const TOWN_CITY_VALIDATION = t(
  "journeys.createApplication.enterAddressManually.townOrCity.validation.required",
);

const COUNTY_CODE = UK_ADDRESS_FIELDS.county;
const COUNTY_LABEL = t(
  "journeys.createApplication.enterAddressManually.county.label",
);

const COUNTRY_CODE = UK_ADDRESS_FIELDS.country;

const POSTCODE_CODE = UK_ADDRESS_FIELDS.postcode;
const POSTCODE_LABEL = t(
  "journeys.createApplication.enterAddressManually.postcode.label",
);
const POSTCODE_REQUIRED_VALIDATION = t(
  "journeys.createApplication.enterAddressManually.postcode.validation.required",
);
const POSTCODE_INVALID_VALIDATION = t(
  "journeys.createApplication.enterAddressManually.postcode.validation.invalid",
);

/**
 * Creates the form blocks for entering a UK address manually.
 *
 * @returns The address fields, overseas-address link, and continue button.
 */
export function manualAddressInputs(): BlockDefinition[] {
  const addressLine1 = textInput(LINE_1_CODE, LINE_1_LABEL, {
    validations: [answerIsRequired(LINE_1_VALIDATION)],
  });
  const addressLine2 = textInput(LINE_2_CODE, LINE_2_LABEL);
  const townOrCity = textInput(TOWN_CITY_CODE, TOWN_CITY_LABEL, {
    classes: "govuk-!-width-two-thirds",
    validations: [answerIsRequired(TOWN_CITY_VALIDATION)],
  });
  const county = textInput(COUNTY_CODE, COUNTY_LABEL, {
    classes: "govuk-!-width-two-thirds",
  });
  const postcode = textInput(POSTCODE_CODE, POSTCODE_LABEL, {
    classes: "govuk-input--width-10",
    validations: [
      answerIsRequired(POSTCODE_REQUIRED_VALIDATION),
      validation({
        condition: Self().match(Condition.Address.IsValidPostcode()),
        message: POSTCODE_INVALID_VALIDATION,
      }),
    ],
  });
  const country = textInput(COUNTRY_CODE, "", {
    classes:
      "govuk-input--width-10 govuk-!-display-none govuk-!-visibility-hidden",
    defaultValue: "United Kingdom",
  });

  return [addressLine1, addressLine2, townOrCity, county, postcode, country];
}

/**
 * Creates a link to the overseas-address form.
 *
 * @returns The overseas-address link block.
 */
export function nonUkAddressLinkBlock(): BlockDefinition {
  return HtmlBlock({
    content: `<p class="govuk-body"><a class="govuk-link" href="enter-overseas-address">${t("journeys.createApplication.enterAddressManually.nonUkAddress")}</a></p>`,
  });
}
