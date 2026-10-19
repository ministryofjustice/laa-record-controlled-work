import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { OutgoingDetails } from "#/export/sections/meansAssessment/calculations/outgoings/outgoings.zod.js";
import type { MeansAssessmentCalculationRow } from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { isChildcareAvailable } from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";
import { hasDependants } from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";
import { CFE_MAX_VALUE } from "#/export/sections/meansAssessment/calculations/calculations.constants.js";
import {
  DEPENDANT_MONTHLY_ALLOWANCE_HINT,
  HOUSING_COSTS_CAP_HINT_THRESHOLD,
} from "#/export/sections/meansAssessment/calculations/calculations.constants.js";
import { negate } from "#/export/sections/meansAssessment/calculations/calculations.helpers.js";
import {
  outgoingDetailsSchema,
  partnerOutgoingSummarySchema,
} from "#/export/sections/meansAssessment/calculations/outgoings/outgoings.zod.js";
import { formatGBP } from "#/lib/currency.js";
import { fixedT } from "#/lib/i18n.js";

interface AdultOutgoingRowsOptions {
  answers: EligibilityData | null | undefined;
  deductions: {
    fixed_employment_deduction?: null | number | undefined;
    national_insurance?: null | number | undefined;
    tax?: null | number | undefined;
  };
  details: OutgoingDetails;
  partnerAllowance: null | number | undefined;
  person: "client" | "partner";
}

interface HouseholdOutgoingRowsOptions {
  answers: EligibilityData | null | undefined;
  hasResultPartner: boolean;
  summary: HouseholdOutgoingSummary;
}

interface HouseholdOutgoingSummary {
  allowed_housing_costs?: null | number | undefined;
  dependant_allowance?: null | number | undefined;
  net_housing_costs?: null | number | undefined;
}

interface OutgoingRowHints {
  additionalHint?: null | string;
  hint?: null | string;
}

const means = { t: fixedT("pages.export.meansAssessment") };
const outgoings = {
  t: fixedT("pages.export.meansAssessment.calculations.outgoings"),
};
const ZERO_AMOUNT = 0;

/**
 * Formats a detailed CFE amount, retaining pence and missing-value semantics.
 * @param amount Saved amount, if present.
 * @returns The formatted amount or the translated not-applicable value.
 */
export function formatOutgoingsCurrency(
  amount: null | number | undefined,
): string {
  if (amount === null || amount === undefined || amount === CFE_MAX_VALUE) {
    return means.t("calculations.notApplicable");
  }
  return formatGBP(amount);
}

/**
 * Maps an adult's outgoing rows from saved amounts.
 * @param options Saved rows, deductions, allowance, and answer context.
 * @param options.answers Saved CCQ answers for childcare relevance.
 * @param options.deductions Saved employment deductions.
 * @param options.details Saved monthly outgoing rows.
 * @param options.partnerAllowance Saved partner allowance, if present.
 * @param options.person Whether these rows belong to client or partner.
 * @returns Ordered rows for the client or partner table.
 */
export function toAdultRows({
  answers,
  deductions,
  details,
  partnerAllowance,
  person,
}: AdultOutgoingRowsOptions): MeansAssessmentCalculationRow[] {
  /* eslint-disable @typescript-eslint/naming-convention -- matches CCQ data keys */
  const { child_care, legal_aid, maintenance_out } =
    details.monthly_equivalents.all_sources;
  const { fixed_employment_deduction, national_insurance, tax } = deductions;
  /* eslint-enable @typescript-eslint/naming-convention */

  const rows: MeansAssessmentCalculationRow[] = [];
  const childcareAvailable =
    answers !== null && answers !== undefined && isChildcareAvailable(answers);

  if (childcareAvailable) {
    rows.push(toOutgoingRow("childcare", child_care));
  }

  rows.push(
    toOutgoingRow("maintenance", maintenance_out),
    toOutgoingRow("legalAid", legal_aid),
    toOutgoingRow("incomeTax", negate(tax)),
    toOutgoingRow("nationalInsurance", negate(national_insurance)),
    toOutgoingRow("employmentExpenses", negate(fixed_employment_deduction), {
      hint: outgoings.t(`${person}EmploymentExpensesHint`),
    }),
  );

  if (
    partnerAllowance !== null &&
    partnerAllowance !== undefined &&
    partnerAllowance > ZERO_AMOUNT
  ) {
    const hint =
      person === "client" ? outgoings.t("clientPartnerAllowanceHint") : null;
    rows.push(toOutgoingRow("partnerAllowance", partnerAllowance, { hint }));
  }

  return rows;
}

/**
 * Maps household rows and CCQ's single-client table placement.
 * @param options Saved household amounts and active answer context.
 * @param options.answers Active saved partner and dependant answers.
 * @param options.hasResultPartner Whether the saved result contains a partner.
 * @param options.summary Saved household outgoing amounts.
 * @returns Housing and applicable dependant rows.
 */
export function toHouseholdRows({
  answers,
  hasResultPartner,
  summary,
}: HouseholdOutgoingRowsOptions): MeansAssessmentCalculationRow[] {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Matches CCQ keys
  const { dependant_allowance, net_housing_costs } = summary;
  const activeDependants = hasDependants(answers ?? {});
  const person = hasResultPartner ? "household" : "client";
  const sharedOwnership =
    answers?.property_owned === "shared_ownership" ? "SharedOwnership" : "";

  const rows = [
    toOutgoingRow("housing", net_housing_costs, {
      additionalHint: housingCapHint(summary, answers, activeDependants),
      hint: outgoings.t(`${person}HousingHint${sharedOwnership}`),
    }),
  ];
  if (activeDependants) {
    rows.push(
      toOutgoingRow("dependantsAllowance", dependant_allowance, {
        hint: outgoings.t("dependantsAllowanceHint", {
          dependantAllowance: DEPENDANT_MONTHLY_ALLOWANCE_HINT,
        }),
      }),
    );
  }
  return rows;
}

/**
 * Translates and formats one saved outgoing row.
 * @param key Locale key for the outgoing row.
 * @param amount Saved or transformed display amount.
 * @param hints Optional explanatory hints.
 * @param hints.additionalHint Optional secondary explanation.
 * @param hints.hint Optional primary explanation.
 * @returns An escaped-text-ready calculation row.
 */
export function toOutgoingRow(
  key: string,
  amount: null | number | undefined,
  hints: OutgoingRowHints = {},
): MeansAssessmentCalculationRow {
  const { additionalHint, hint } = hints;
  return {
    ...(additionalHint ? { additionalHint } : {}),
    amount: formatOutgoingsCurrency(amount),
    heading: outgoings.t(`rows.${key}`),
    hint: hint ?? null,
  };
}

/**
 * Parses and maps partner outgoing details when saved-result partner data exists.
 * @param details Saved partner outgoing details.
 * @param summary Saved partner deduction summary.
 * @param answers Saved CCQ answers used for childcare relevance.
 * @returns Partner rows, or null when a required partner branch is invalid.
 */
export function toPartnerRows(
  details: unknown,
  summary: unknown,
  answers: EligibilityData | null | undefined,
): MeansAssessmentCalculationRow[] | null {
  const parsedDetails = outgoingDetailsSchema.safeParse(details);
  const parsedSummary = partnerOutgoingSummarySchema.safeParse(summary);
  if (!parsedDetails.success || !parsedSummary.success) {
    return null;
  }
  return toAdultRows({
    answers,
    deductions: parsedSummary.data.employment_income,
    details: parsedDetails.data,
    partnerAllowance: parsedSummary.data.partner_allowance,
    person: "partner",
  });
}

/**
 * Determines whether CCQ's single-client housing cap hint applies.
 * @param summary Saved allowed housing costs.
 * @param answers Active saved partner and dependant answers.
 * @param activeDependants Whether active child or adult dependants exist.
 * @returns Whether to display the cap hint; it never adjusts amounts.
 */
function housingCapHint(
  summary: HouseholdOutgoingSummary,
  answers: EligibilityData | null | undefined,
  activeDependants: boolean,
): null | string {
  const allowedHousingCosts = summary.allowed_housing_costs;
  // CCQ result partner controls grouping; active Check answers control hints.
  // CCQ: app/models/calculation_result.rb#household_outgoing_rows;
  // app/models/check.rb#partner? and #dependants?.
  const hasHint =
    allowedHousingCosts !== null &&
    allowedHousingCosts !== undefined &&
    allowedHousingCosts >= HOUSING_COSTS_CAP_HINT_THRESHOLD &&
    answers?.partner !== true &&
    !activeDependants;

  return hasHint ? outgoings.t("housingCapHint") : null;
}
