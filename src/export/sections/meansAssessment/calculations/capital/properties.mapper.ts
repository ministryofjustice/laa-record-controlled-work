import type {
  CfeClientProperties,
  CfePartnerProperties,
  CfeProperty,
} from "#/export/sections/meansAssessment/calculations/capital/properties.zod.js";
import type {
  MeansAssessmentCalculationRow,
  MeansAssessmentCalculationTable,
} from "#/export/sections/meansAssessment/meansAssessment.types.js";

import {
  hasSubjectMatterOfDisputeAllowance,
  toAssessedEquityRow,
  toNetEquityRow,
  toPartialOwnershipHint,
  toPropertyRows,
} from "#/export/sections/meansAssessment/calculations/capital/properties.format.js";
import {
  capitalBranchSchema,
  capitalItemsSchema,
  clientPropertiesSchema,
  partnerPropertiesSchema,
} from "#/export/sections/meansAssessment/calculations/capital/properties.zod.js";
import { fixedT } from "#/lib/i18n.js";

const ZERO_AMOUNT = 0;
const FIRST_ADDITIONAL_PROPERTY_INDEX = 0;
const FIRST_PROPERTY_NUMBER = 1;
const FULL_OWNERSHIP_PERCENTAGE = 100;
const capital = {
  t: fixedT("pages.export.meansAssessment.calculations.capital"),
};

type PropertyValueResult =
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "present"; value: unknown };

/**
 * Maps saved properties in CCQ's main-home, client, then partner order.
 * @param clientCapital Saved client capital branch.
 * @param partnerCapital Saved partner capital branch.
 * @param hasPartner Whether saved CFE data contains a partner.
 * @returns Property tables or null when a present structure is incompatible.
 */
export function toPropertyTables(
  clientCapital: unknown,
  partnerCapital: unknown,
  hasPartner: boolean,
): MeansAssessmentCalculationTable[] | null {
  const clientProperties = parseClientProperties(clientCapital);
  const partnerProperties = parsePartnerProperties(partnerCapital);

  if (clientProperties === null) {
    return null;
  }

  if (partnerProperties === null) {
    return null;
  }

  const tables = clientProperties
    ? toClientPropertyTables(clientProperties)
    : [];

  if (!hasPartner) {
    return tables;
  }

  if (partnerProperties !== undefined) {
    tables.push(...toPartnerPropertyTables(partnerProperties));
  }
  return tables;
}

/**
 * Parses the saved client's properties independently of result summaries.
 * @param capital Saved client capital branch.
 * @returns Valid properties, undefined when absent, or null when malformed.
 */
function parseClientProperties(
  capital: unknown,
): CfeClientProperties | null | undefined {
  const properties = parsePropertiesFromCapital(capital);
  if (properties.status === "absent") {
    return undefined;
  }
  if (properties.status === "invalid") {
    return null;
  }

  const parsed = clientPropertiesSchema.safeParse(properties.value);
  return parsed.success ? parsed.data : null;
}

/**
 * Parses the saved partner's properties independently of result summaries.
 * @param capital Saved partner capital branch.
 * @returns Valid properties, undefined when absent, or null when malformed.
 */
function parsePartnerProperties(
  capital: unknown,
): CfePartnerProperties | null | undefined {
  const properties = parsePropertiesFromCapital(capital);
  if (properties.status === "absent") {
    return undefined;
  }
  if (properties.status === "invalid") {
    return null;
  }

  const parsed = partnerPropertiesSchema.safeParse(properties.value);
  return parsed.success ? parsed.data : null;
}

/**
 * Parses the saved `capital_items.properties` branch without coercion.
 * @param capital Saved client or partner capital branch.
 * @returns Whether the properties are absent, invalid, or present.
 */
function parsePropertiesFromCapital(capital: unknown): PropertyValueResult {
  if (capital === null || capital === undefined) {
    return { status: "absent" };
  }

  const parsedCapital = capitalBranchSchema.safeParse(capital);
  if (!parsedCapital.success) {
    return { status: "invalid" };
  }

  const capitalItems = parsedCapital.data.capital_items;
  if (capitalItems === null || capitalItems === undefined) {
    return { status: "absent" };
  }

  const parsedItems = capitalItemsSchema.safeParse(capitalItems);
  if (!parsedItems.success) {
    return { status: "invalid" };
  }

  const { properties } = parsedItems.data;
  if (properties === null || properties === undefined) {
    return { status: "absent" };
  }
  return { status: "present", value: properties };
}

/**
 * Formats the caption for the saved property sequence.
 * @param person Property owner.
 * @param type Main home or additional property.
 * @param index Zero-based additional-property index.
 * @returns The translated property caption.
 */
function tableHeading(
  person: "client" | "partner",
  type: "additional" | "main",
  index: number,
): string {
  if (type === "main") {
    return capital.t("tables.mainHome");
  }
  return capital.t(`tables.${person}Additional`, {
    counter: index + FIRST_PROPERTY_NUMBER,
  });
}

/**
 * Maps the client's positive-value main home and saved additional properties.
 * CCQ: laa-check-client-qualifies/app/models/calculation_result.rb#client_owns_main_home? and #additional_property_data.
 * @param properties Validated saved client property container.
 * @returns Ordered client property tables.
 */
function toClientPropertyTables(
  properties: CfeClientProperties,
): MeansAssessmentCalculationTable[] {
  const tables: MeansAssessmentCalculationTable[] = [];
  const mainHome = properties.main_home;
  if (
    mainHome?.value !== null &&
    mainHome?.value !== undefined &&
    mainHome.value > ZERO_AMOUNT
  ) {
    tables.push(toPropertyTable(mainHome, "client", "main"));
  }

  properties.additional_properties.forEach((property, index) => {
    tables.push(toPropertyTable(property, "client", "additional", index));
  });
  return tables;
}

/**
 * Maps upper property rows, saved net equity, lower property rows, and assessed value.
 * @param property Saved CFE property amounts.
 * @param isAdditional Whether the value row uses additional-property wording.
 * @returns Rows for CCQ's full partial-ownership layout.
 */
function toPartiallyOwnedRows(
  property: CfeProperty,
  isAdditional: boolean,
): MeansAssessmentCalculationRow[] {
  return [
    ...toPropertyRows(property, isAdditional, [
      "value",
      "mortgage",
      "transactionAllowance",
    ]),
    toNetEquityRow(property),
    ...toPropertyRows(property, isAdditional, [
      "smodAllowance",
      "mainHomeDisregard",
    ]),
    toAssessedEquityRow(property, null),
  ];
}

/**
 * Maps saved partner additional properties without inventing a main home.
 * @param properties Validated saved partner property container.
 * @returns Ordered partner additional-property tables.
 */
function toPartnerPropertyTables(
  properties: CfePartnerProperties,
): MeansAssessmentCalculationTable[] {
  return properties.additional_properties.map((property, index) =>
    toPropertyTable(property, "partner", "additional", index),
  );
}

/**
 * Prepares one property table using CCQ's ownership-specific row layout.
 * CCQ: laa-check-client-qualifies/app/models/calculation_result.rb#property_data;
 * app/views/results/_property_table.html.slim.
 * @param property Saved CFE property amounts.
 * @param person Property owner used for labels and partial-share hints.
 * @param type Main home or additional property.
 * @param index Zero-based position in the saved additional-properties array.
 * @returns A prepared table with CCQ's ownership layout.
 */
function toPropertyTable(
  property: CfeProperty,
  person: "client" | "partner",
  type: "additional" | "main",
  index = FIRST_ADDITIONAL_PROPERTY_INDEX,
): MeansAssessmentCalculationTable {
  const isAdditional = type === "additional";
  const partialOwnership =
    property.percentage_owned < FULL_OWNERSHIP_PERCENTAGE;
  // CCQ uses a minimal layout without a nonzero Subject Matter of Dispute allowance.
  const minimalPartial =
    isAdditional &&
    partialOwnership &&
    !hasSubjectMatterOfDisputeAllowance(property);
  const propertyRows = toPropertyRows(property, isAdditional);
  const rows =
    partialOwnership && !minimalPartial
      ? toPartiallyOwnedRows(property, isAdditional)
      : [
          ...propertyRows,
          toAssessedEquityRow(
            property,
            minimalPartial ? toPartialOwnershipHint(person, property) : null,
          ),
        ];

  return {
    heading: tableHeading(person, type, index),
    hint: null,
    rows,
  };
}
