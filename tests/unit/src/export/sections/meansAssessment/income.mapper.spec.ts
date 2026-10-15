/* eslint-disable @typescript-eslint/no-magic-numbers -- synthetic saved result values */
import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { MeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { MeansAssessmentStatus } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

/**
 * Maps a saved result through the public section mapper.
 * @param result Synthetic saved CFE result.
 * @param data Saved answers that accompany the result.
 * @returns The prepared means section.
 */
function mapResult(
  result: Record<string, unknown>,
  data: Partial<EligibilityData> = {},
): MeansAssessmentSection | null {
  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: { data, result },
      meansAssessmentRequired: true,
    }),
  );
}

describe("toMeansAssessmentSection income breakdown", () => {
  before(initializeI18nextSync);

  it("maps all saved income rows and the minimum saved threshold", () => {
    const result = {
      assessment: {
        gross_income: {
          irregular_income: {
            monthly_equivalents: { student_loan: 0.01 },
          },
          other_income: {
            monthly_equivalents: {
              all_sources: {
                friends_or_family: 1.23,
                maintenance_in: null,
                pension: 0,
              },
            },
          },
          state_benefits: { monthly_equivalents: { all_sources: 0 } },
        },
      },
      result_summary: {
        disposable_income: {
          employment_income: { gross_income: 1_000.5 },
        },
        gross_income: {
          combined_total_gross_income: 102.03,
          proceeding_types: [
            { result: "eligible", upper_threshold: 2_500 },
            { result: "eligible", upper_threshold: 2_000 },
          ],
        },
        overall_result: { result: "eligible" },
      },
    };
    const section = mapResult(result, { employment_status: "unemployed" });

    expect(section?.incomeBreakdown).to.deep.equal({
      heading: "Income calculation",
      status: "ready",
      tables: [
        {
          heading: "Client's monthly income",
          hint: "All figures have been converted into a monthly amount.",
          rows: [
            { amount: "£1,000.50", heading: "Employment income", hint: null },
            {
              amount: "£0.00",
              heading: "Benefits received",
              hint: "This does not include Housing Benefit",
            },
            {
              amount: "£1.23",
              heading: "Financial help from friends and family",
              hint: null,
            },
            {
              amount: "Not applicable",
              heading: "Maintenance payments from a former partner",
              hint: null,
            },
            {
              amount: "Not applicable",
              heading: "Income from a property or lodger",
              hint: null,
            },
            { amount: "£0.00", heading: "Pensions", hint: null },
            { amount: "£0.01", heading: "Student finance", hint: null },
            {
              amount: "Not applicable",
              heading: "Other sources",
              hint: null,
            },
          ],
        },
        {
          heading: "Total",
          hint: null,
          rows: [
            {
              amount: "£102.03",
              emphasis: true,
              heading: "Total monthly income",
              hint: null,
            },
            {
              amount: "£2,000.00",
              heading: "Monthly income upper limit",
              hint: null,
            },
          ],
        },
      ],
    });
  });

  it("detects partners from saved capital and ignores answer selectors", () => {
    const result = {
      assessment: {
        gross_income: {
          irregular_income: { monthly_equivalents: {} },
          other_income: { monthly_equivalents: { all_sources: {} } },
          state_benefits: { monthly_equivalents: {} },
        },
        partner_capital: { capital_items: {} },
        partner_gross_income: {
          irregular_income: { monthly_equivalents: {} },
          other_income: { monthly_equivalents: { all_sources: {} } },
          state_benefits: { monthly_equivalents: {} },
        },
      },
      result_summary: {
        disposable_income: {
          employment_income: { gross_income: 1_000 },
        },
        gross_income: {
          combined_total_gross_income: 1_350,
          proceeding_types: [{ result: "eligible", upper_threshold: 2_000 }],
        },
        overall_result: { result: "eligible" },
        partner_disposable_income: {
          employment_income: { gross_income: 350 },
        },
      },
    };
    const section = mapResult(result, { partner: false });
    const breakdown = section?.incomeBreakdown;

    expect(breakdown?.status).to.equal("ready");
    if (breakdown?.status === "ready") {
      expect(breakdown.tables.map(({ heading }) => heading)).to.deep.equal([
        "Client's monthly income",
        "Partner's monthly income",
        "Total",
      ]);
      expect(breakdown.tables[2].rows[0]).to.include({
        heading: "Total client and partner monthly income",
      });
    }
  });

  it("does not treat empty partner capital as a partner selector", () => {
    const result = {
      assessment: {
        gross_income: {
          irregular_income: { monthly_equivalents: {} },
          other_income: { monthly_equivalents: { all_sources: {} } },
          state_benefits: { monthly_equivalents: {} },
        },
        partner_capital: {},
      },
      result_summary: {
        disposable_income: { employment_income: {} },
        gross_income: {
          combined_total_gross_income: null,
          proceeding_types: [{ result: "eligible", upper_threshold: 500 }],
        },
        overall_result: { result: "eligible" },
      },
    };
    const section = mapResult(result, { partner: true });
    const breakdown = section?.incomeBreakdown;

    expect(breakdown?.status).to.equal("ready");
    if (breakdown?.status === "ready") {
      expect(breakdown.tables.map(({ heading }) => heading)).to.deep.equal([
        "Client's monthly income",
        "Total",
      ]);
    }
  });

  it("omits every income table when a consumed detail is malformed", () => {
    const resultSummary = {
      gross_income: {
        combined_total_gross_income: 100,
        proceeding_types: [{ result: "eligible", upper_threshold: 500 }],
      },
      overall_result: { result: "eligible" },
    };
    const invalidResults = [
      {
        assessment: { gross_income: {} },
        result_summary: resultSummary,
      },
      {
        assessment: {
          gross_income: {
            irregular_income: { monthly_equivalents: {} },
            other_income: { monthly_equivalents: { all_sources: {} } },
            state_benefits: { monthly_equivalents: { all_sources: "100" } },
          },
        },
        result_summary: resultSummary,
      },
      {
        assessment: {
          gross_income: {
            irregular_income: { monthly_equivalents: {} },
            other_income: { monthly_equivalents: { all_sources: {} } },
            state_benefits: {
              monthly_equivalents: {
                all_sources: Number.POSITIVE_INFINITY,
              },
            },
          },
          partner_capital: { capital_items: {} },
          partner_gross_income: {},
        },
        result_summary: resultSummary,
      },
      {
        assessment: {
          gross_income: {
            irregular_income: { monthly_equivalents: {} },
            other_income: { monthly_equivalents: { all_sources: {} } },
            state_benefits: { monthly_equivalents: {} },
          },
          partner_capital: [],
        },
        result_summary: resultSummary,
      },
    ];

    for (const result of invalidResults) {
      const section = mapResult(result);

      expect(section?.calculations.status).to.equal(
        MeansAssessmentStatus.Ready,
      );
      expect(section?.outcomeSummary.totals).not.to.equal(null);
      expect(section?.incomeBreakdown).to.deep.equal({
        heading: "Income calculation",
        message: "Income calculation details are unavailable.",
        status: "unavailable",
      });
    }
  });

  it("ignores additional fields and formats sentinel and negative zero safely", () => {
    const result = {
      assessment: {
        future_result_field: "unused",
        gross_income: {
          irregular_income: { monthly_equivalents: {} },
          other_income: {
            monthly_equivalents: {
              all_sources: { friends_or_family: -2.5 },
            },
          },
          state_benefits: { monthly_equivalents: { all_sources: -0 } },
        },
      },
      result_summary: {
        disposable_income: { employment_income: {} },
        gross_income: {
          combined_total_gross_income: 999_999_999_999,
          proceeding_types: [
            { result: "eligible", upper_threshold: 999_999_999_999 },
          ],
        },
        overall_result: { result: "eligible" },
      },
    };
    const breakdown = mapResult(result)?.incomeBreakdown;

    expect(breakdown?.status).to.equal("ready");
    if (breakdown?.status === "ready") {
      expect(breakdown.tables[0].rows[1].amount).to.equal("£0.00");
      expect(breakdown.tables[0].rows[2].amount).to.equal("-£2.50");
      expect(
        breakdown.tables[1].rows.map(({ amount }) => amount),
      ).to.deep.equal(["Not applicable", "Not applicable"]);
    }
  });

  it("omits income details when the saved category was not calculated", () => {
    const result = {
      result_summary: {
        disposable_income: {
          combined_total_disposable_income: 100,
          employment_income: { gross_income: 700 },
          proceeding_types: [{ result: "eligible", upper_threshold: 1_000 }],
        },
        gross_income: {
          proceeding_types: [
            { result: "not_calculated", upper_threshold: 2_000 },
          ],
        },
        overall_result: { result: "eligible" },
      },
    };
    const breakdown = mapResult(result)?.incomeBreakdown;

    expect(breakdown).to.deep.equal({ status: "not-calculated" });
  });
});
