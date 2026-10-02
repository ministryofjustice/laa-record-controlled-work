import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKHeading,
  GovUKTextInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { Autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import { textInput } from "#/journeys/shared.blocks.js";
import { required } from "#/journeys/validation.js";
import { COUNTRY_NAMES } from "#/lib/countries.js";
import { fixedT } from "#/lib/i18n.js";

const MINIMUM_AUTOCOMPLETE_CHARACTERS = 2;

const overseasAddressT = fixedT(
  "journeys.createApplication.enterOverseasAddress",
);

const line1 = {
  code: AnswerKey.osAddressLine1,
  label: overseasAddressT("address.line1.label"),
  requiredValidation: overseasAddressT("address.line1.validation.required"),
};

const line2 = {
  code: AnswerKey.osAddressLine2,
  label: overseasAddressT("address.line2.label"),
};

const line3 = {
  code: AnswerKey.osAddressLine3,
  label: overseasAddressT("address.line3.label"),
};

const line4 = {
  code: AnswerKey.osAddressLine4,
  label: overseasAddressT("address.line4.label"),
};

const country = {
  clearLinkText: overseasAddressT("country.clearButton"),
  code: AnswerKey.osCountry,
  label: overseasAddressT("country.label"),
  requiredValidation: overseasAddressT("country.validation.required"),
};

/**
 * Creates the country autocomplete input.
 *
 * @returns An autocomplete containing the supported country names.
 */
export function countryAutocomplete(): ReturnType<typeof Autocomplete> {
  return Autocomplete({
    clearLinkText: country.clearLinkText,
    data: COUNTRY_NAMES,
    field: GovUKTextInput({
      code: country.code,
      label: {
        classes: "govuk-label--m",
        isPageHeading: false,
        text: country.label,
      },
      validWhen: [required(country.requiredValidation)],
    }),
    minLength: MINIMUM_AUTOCOMPLETE_CHARACTERS,
    showAllValues: false,
    showNoOptionsFound: true,
  });
}

/**
 * Creates the heading for the overseas address fields.
 *
 * @returns A heading for the address section.
 */
export function overseasAddressHeading(): ReturnType<typeof GovUKHeading> {
  return GovUKHeading({
    classes: "govuk-label--m",
    text: overseasAddressT("address.title"),
  });
}

/**
 * Creates the overseas address line inputs.
 *
 * @returns The overseas address input fields.
 */
export function overseasAddressInputs(): GovUKTextInput[] {
  const addressLine1 = textInput(line1.code, line1.label, {
    validations: [required(line1.requiredValidation)],
  });
  const addressLine2 = textInput(line2.code, line2.label);
  const addressLine3 = textInput(line3.code, line3.label);
  const addressLine4 = textInput(line4.code, line4.label);

  return [addressLine1, addressLine2, addressLine3, addressLine4];
}

/**
 * Creates the link for switching to UK address entry.
 *
 * @returns A link to the manual UK address step.
 */
export function ukAddressLinkBlock(): HtmlBlock {
  return HtmlBlock({
    content: `<p class="govuk-body"><a class="govuk-link" href="enter-address-manually">${overseasAddressT("address.ukAddress")}</a></p>`,
  });
}
