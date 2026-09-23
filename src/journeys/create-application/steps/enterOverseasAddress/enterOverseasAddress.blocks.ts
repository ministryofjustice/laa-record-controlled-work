import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKHeading,
  GovUKTextInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { Autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import { COUNTRY_NAMES } from "#/lib/countries.js";
import { t } from "#/lib/i18n.js";

const MINIMUM_AUTOCOMPLETE_CHARACTERS = 2;

const ADDRESS_TITLE = t(
  "journeys.createApplication.enterOverseasAddress.address.title",
);
const COUNTRY_LABEL = t(
  "journeys.createApplication.enterOverseasAddress.country.label",
);
const COUNTRY_REQUIRED_VALIDATION = t(
  "journeys.createApplication.enterOverseasAddress.country.validation.required",
);
const ADDRESS_LINE_1_LABEL = t(
  "journeys.createApplication.enterOverseasAddress.address.line1.label",
);
const ADDRESS_LINE_1_REQUIRED_VALIDATION = t(
  "journeys.createApplication.enterOverseasAddress.address.line1.validation.required",
);
const ADDRESS_LINE_2_LABEL = t(
  "journeys.createApplication.enterOverseasAddress.address.line2.label",
);
const ADDRESS_LINE_3_LABEL = t(
  "journeys.createApplication.enterOverseasAddress.address.line3.label",
);
const ADDRESS_LINE_4_LABEL = t(
  "journeys.createApplication.enterOverseasAddress.address.line4.label",
);

/**
 * Creates the required first overseas address line input.
 *
 * @returns A text input for address line 1.
 */
export function addressLine1Input(): GovUKTextInput {
  return GovUKTextInput({
    code: AnswerKey.osAddressLine1,
    label: {
      isPageHeading: false,
      text: ADDRESS_LINE_1_LABEL,
    },
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: ADDRESS_LINE_1_REQUIRED_VALIDATION,
      }),
    ],
  });
}

/**
 * Creates the optional second overseas address line input.
 *
 * @returns A text input for address line 2.
 */
export function addressLine2Input(): GovUKTextInput {
  return GovUKTextInput({
    code: AnswerKey.osAddressLine2,
    label: {
      isPageHeading: false,
      text: ADDRESS_LINE_2_LABEL,
    },
  });
}

/**
 * Creates the optional third overseas address line input.
 *
 * @returns A text input for address line 3.
 */
export function addressLine3Input(): GovUKTextInput {
  return GovUKTextInput({
    code: AnswerKey.osAddressLine3,
    label: {
      isPageHeading: false,
      text: ADDRESS_LINE_3_LABEL,
    },
  });
}

/**
 * Creates the optional fourth overseas address line input.
 *
 * @returns A text input for address line 4.
 */
export function addressLine4Input(): GovUKTextInput {
  return GovUKTextInput({
    code: AnswerKey.osAddressLine4,
    label: {
      isPageHeading: false,
      text: ADDRESS_LINE_4_LABEL,
    },
  });
}

/**
 * Creates the country autocomplete input.
 *
 * @returns An autocomplete containing the supported country names.
 */
export function countryAutocomplete(): ReturnType<typeof Autocomplete> {
  return Autocomplete({
    clearLinkText: t(
      "journeys.createApplication.enterOverseasAddress.country.clearButton",
    ),
    data: COUNTRY_NAMES,
    field: GovUKTextInput({
      code: AnswerKey.osCountry,
      label: {
        classes: "govuk-label--m",
        isPageHeading: false,
        text: COUNTRY_LABEL,
      },
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: COUNTRY_REQUIRED_VALIDATION,
        }),
      ],
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
    text: ADDRESS_TITLE,
  });
}

/**
 * Creates the link for switching to UK address entry.
 *
 * @returns A link to the manual UK address step.
 */
export function ukAddressLink(): ReturnType<typeof HtmlBlock> {
  return HtmlBlock({
    content: `<p class="govuk-body"><a class="govuk-link" href="enter-address-manually">${t("journeys.createApplication.enterOverseasAddress.address.ukAddress")}</a></p>`,
  });
}
