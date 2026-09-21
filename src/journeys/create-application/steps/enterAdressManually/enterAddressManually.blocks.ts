import type {
  HtmlBlock,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKTextInput } from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "i18next";

import { UK_ADDRESS_FIELDS } from "#/journeys/journey.constants.js";

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

const COUNTRY_CODE = UK_ADDRESS_FIELDS.postcode;

/**
 *
 * @param code
 * @param labelText
 * @param options
 * @param options.classes
 * @param options.isRequired
 * @param options.isRequired.validationMessage
 * @param options.defaultValue
 */
function textInput(
  code: string,
  labelText: string,
  options?: {
    classes?: string;
    defaultValue?: string;
    isRequired?: {
      validationMessage: ResolvableString;
    };
  },
): HtmlBlock {
  const validWhen = options?.isRequired
    ? {
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: options.isRequired.validationMessage,
          }),
        ],
      }
    : {};

  return GovUKTextInput({
    classes: options?.classes,
    code,
    defaultValue: options?.defaultValue,
    label: {
      isPageHeading: false,
      text: labelText,
    },
    ...validWhen,
  });
}

const addressLine1 = textInput(LINE_1_CODE, LINE_1_LABEL, {
  isRequired: {
    validationMessage: LINE_1_VALIDATION,
  },
});
const addressLine2 = textInput(LINE_2_CODE, LINE_2_LABEL);

const townOrCity = textInput(TOWN_CITY_CODE, TOWN_CITY_LABEL, {
  classes: "govuk-!-width-two-thirds",
  isRequired: {
    validationMessage: TOWN_CITY_VALIDATION,
  },
});

const county = textInput(COUNTY_CODE, COUNTY_LABEL, {
  classes: "govuk-!-width-two-thirds",
});

const country = textInput(COUNTRY_CODE, "", {
  classes:
    "govuk-input--width-10 govuk-!-display-none govuk-!-visibility-hidden",
  defaultValue: "United Kingdom",
});

const postcode = "TODO";

// GovUKTextInput({
//   classes: "govuk-input--width-10",
//   code: UK_ADDRESS_FIELDS.postcode,
//   label: {
//     isPageHeading: false,
//     text: t(
//       "journeys.createApplication.enterAddressManually.postcode.label",
//     ),
//   },
//   validWhen: [
//     validation({
//       condition: Self().match(Condition.IsRequired()),
//       message: t(
//         "journeys.createApplication.enterAddressManually.postcode.validation.required",
//       ),
//     }),
//     validation({
//       condition: Self().match(Condition.Address.IsValidPostcode()),
//       message: t(
//         "journeys.createApplication.enterAddressManually.postcode.validation.invalid",
//       ),
//     }),
//   ],
// }),

const addressInputs = [
  addressLine1,
  addressLine2,
  townOrCity,
  county,
  postcode,
  country,
];

const nonUkAddressLink = "TODO";
// HtmlBlock({
//   content: `<p class="govuk-body"><a class="govuk-link" href="enter-overseas-address">${t("journeys.createApplication.enterAddressManually.nonUkAddress")}</a></p>`,
// }),

// GovUKButton({ text: t("common.continue") }),
//   function HtmlBlock(arg0: { content: string; }) {
//     throw new Error("Function not implemented.");
//   }
