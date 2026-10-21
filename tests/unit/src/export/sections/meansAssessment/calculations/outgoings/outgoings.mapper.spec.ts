import { expect } from "chai";
import { before, describe, it } from "mocha";

import type {
  MeansAssessmentCalculationBreakdown,
  MeansAssessmentSection,
} from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

function mapResult(
  result: Record<string, unknown>,
  data: Record<string, unknown> = {},
): MeansAssessmentSection | null {
  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: { data, result },
      meansAssessmentRequired: true,
    }),
  );
}

function result(
  overrides: {
    assessment?: Record<string, unknown>;
    disposableIncome?: Record<string, unknown>;
    otherSummary?: Record<string, unknown>;
  } = {},
): Record<string, unknown> {
  const {
    assessment = {},
    disposableIncome = {},
    otherSummary = {},
  } = overrides;
  return {
    assessment: {
      disposable_income: {
        monthly_equivalents: {
          all_sources: { child_care: null, legal_aid: 0, maintenance_out: 0 },
        },
      },
      ...assessment,
    },
    result_summary: {
      disposable_income: {
        allowed_housing_costs: 0,
        combined_total_disposable_income: 55,
        combined_total_outgoings_and_allowances: 700,
        dependant_allowance: 0,
        employment_income: {
          fixed_employment_deduction: 0,
          national_insurance: 0,
          tax: 0,
        },
        net_housing_costs: 200,
        proceeding_types: [{ result: "eligible", upper_threshold: 733 }],
        ...disposableIncome,
      },
      overall_result: { result: "eligible" },
      ...otherSummary,
    },
  };
}

function breakdown(
  savedResult: Record<string, unknown>,
  data: Record<string, unknown> = {},
): MeansAssessmentCalculationBreakdown | undefined {
  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: { data, result: savedResult },
      meansAssessmentRequired: true,
    }),
  )?.outgoingsBreakdown;
}

describe("toMeansAssessmentSection outgoings breakdown", () => {
  before(initializeI18nextSync);

  it("maps saved deductions, household rows, totals, and minimum threshold", () => {
    const result = {
      assessment: {
        disposable_income: {
          monthly_equivalents: {
            all_sources: {
              child_care: 12.34,
              legal_aid: 0,
              maintenance_out: null,
            },
          },
        },
      },
      result_summary: {
        disposable_income: {
          allowed_housing_costs: 545,
          combined_total_disposable_income: 42.42,
          combined_total_outgoings_and_allowances: 999.99,
          dependant_allowance: 20.01,
          employment_income: {
            fixed_employment_deduction: 10,
            national_insurance: 2.01,
            tax: 15.2,
          },
          net_housing_costs: 400.5,
          proceeding_types: [
            { result: "eligible", upper_threshold: 733 },
            { result: "eligible", upper_threshold: 650 },
          ],
        },
        overall_result: { result: "eligible" },
      },
    };
    const section = mapResult(result, {
      child_dependants: true,
      employment_status: "in_work",
      incomes: [{ income_type: "employment" }],
      property_owned: "shared_ownership",
    });

    expect(section?.outgoingsBreakdown).to.deep.equal({
      heading: "Outgoings calculation",
      status: "ready",
      tables: [
        {
          heading: "Client's monthly outgoings",
          hint: "All figures have been converted into a monthly amount.",
          rows: [
            { amount: "£12.34", heading: "Childcare payments", hint: null },
            {
              amount: "Not applicable",
              heading: "Maintenance payments to a former partner",
              hint: null,
            },
            {
              amount: "£0.00",
              heading: "Payments towards legal aid in a criminal case",
              hint: null,
            },
            { amount: "-£15.20", heading: "Income tax", hint: null },
            { amount: "-£2.01", heading: "National Insurance", hint: null },
            {
              amount: "-£10.00",
              heading: "Employment expenses",
              hint: "A fixed allowance if your client gets a salary or wage",
            },
            {
              amount: "£400.50",
              heading: "Housing payments",
              hint: "Rent and mortgage costs minus any Housing Benefit payments your client gets",
            },
            {
              amount: "£20.01",
              heading: "Dependants allowance",
              hint: "An allowance of £381.86 applied for each dependant, minus any income they receive",
            },
          ],
        },
        {
          heading: "Total",
          hint: null,
          rows: [
            {
              amount: "£999.99",
              emphasis: true,
              heading: "Total monthly outgoings",
              hint: null,
            },
            {
              amount: "£42.42",
              heading: "Assessed disposable monthly income",
              hint: "Total monthly income minus total monthly outgoings",
            },
            {
              amount: "£650.00",
              heading: "Disposable monthly income upper limit",
              hint: null,
            },
          ],
        },
      ],
    });
  });

  it("does not display zero employment deductions as negative zero", () => {
    const mapped = breakdown(result());

    expect(mapped?.status).to.equal("ready");
    if (mapped?.status === "ready") {
      const deductions = mapped.tables[0].rows.filter(({ heading }) =>
        ["Income tax", "National Insurance", "Employment expenses"].includes(
          heading,
        ),
      );

      expect(deductions.map(({ amount }) => amount)).to.deep.equal([
        "£0.00",
        "£0.00",
        "£0.00",
      ]);
    }
  });

  it("preserves unlimited deduction sentinels for not-applicable formatting", () => {
    const mapped = breakdown(
      result({
        disposableIncome: {
          employment_income: {
            fixed_employment_deduction: 0,
            national_insurance: 0,
            tax: 999_999_999_999,
          },
        },
      }),
    );

    expect(mapped?.status).to.equal("ready");
    if (mapped?.status === "ready") {
      const incomeTax = mapped.tables[0].rows.find(
        ({ heading }) => heading === "Income tax",
      );
      expect(incomeTax?.amount).to.equal("Not applicable");
    }
  });

  it("shows missing and unlimited saved values as not applicable", () => {
    const result = {
      assessment: {
        disposable_income: {
          monthly_equivalents: { all_sources: { legal_aid: 0 } },
        },
      },
      result_summary: {
        disposable_income: {
          combined_total_disposable_income: null,
          combined_total_outgoings_and_allowances: 999_999_999_999,
          employment_income: {},
          net_housing_costs: null,
          proceeding_types: [
            { result: "eligible", upper_threshold: 999_999_999_999 },
          ],
        },
        overall_result: { result: "eligible" },
      },
    };
    const breakdown = mapResult(result)?.outgoingsBreakdown;

    expect(breakdown?.status).to.equal("ready");
    if (breakdown?.status === "ready") {
      expect(breakdown.tables[0].rows[1]).to.include({
        amount: "£0.00",
        heading: "Payments towards legal aid in a criminal case",
      });
      expect(breakdown.tables[0].rows.at(-1)).to.include({
        amount: "Not applicable",
        heading: "Housing payments",
      });
      expect(
        breakdown.tables[1].rows.map(({ amount }) => amount),
      ).to.deep.equal(["Not applicable", "Not applicable", "Not applicable"]);
    }
  });

  it("ignores malformed partner branches when saved results have no partner", () => {
    const result = {
      assessment: {
        disposable_income: {
          monthly_equivalents: { all_sources: {} },
        },
        partner_disposable_income: "stale partner branch",
      },
      result_summary: {
        disposable_income: {
          employment_income: {},
          proceeding_types: [{ result: "eligible", upper_threshold: 733 }],
        },
        overall_result: { result: "eligible" },
        partner_disposable_income: [],
      },
    };

    expect(mapResult(result)?.outgoingsBreakdown?.status).to.equal("ready");
  });

  it("groups saved partner rows and keeps household rows separate", () => {
    const savedResult = result({
      assessment: {
        partner_capital: { capital_items: {} },
        partner_disposable_income: {
          monthly_equivalents: {
            all_sources: {
              child_care: null,
              legal_aid: 6,
              maintenance_out: 5,
            },
          },
        },
      },
      disposableIncome: {
        allowed_housing_costs: 600,
        partner_allowance: 15,
      },
      otherSummary: {
        partner_disposable_income: {
          employment_income: {
            fixed_employment_deduction: 3,
            national_insurance: 2,
            tax: 1,
          },
          partner_allowance: 0,
        },
      },
    });
    const mapped = breakdown(savedResult, {
      adult_dependants: false,
      child_dependants: false,
      partner: false,
    });

    expect(mapped?.status).to.equal("ready");
    if (mapped?.status === "ready") {
      expect(mapped.tables.map(({ heading }) => heading)).to.deep.equal([
        "Client's monthly outgoings",
        "Partner's monthly outgoings",
        "Household monthly outgoings",
        "Total",
      ]);
      expect(mapped.tables[0].rows.map(({ heading }) => heading)).to.include(
        "Partner allowance",
      );
      expect(
        mapped.tables[1].rows.map(({ heading }) => heading),
      ).not.to.include("Partner allowance");
      expect(mapped.tables[2].rows).to.deep.equal([
        {
          additionalHint:
            "Housing costs are capped at £545 for single clients without dependants",
          amount: "£200.00",
          heading: "Housing payments",
          hint: "Housing costs minus any Housing Benefit payments the household gets",
        },
      ]);
      expect(mapped.tables[3].rows[0]).to.include({
        amount: "£700.00",
        heading: "Total client and partner monthly outgoings",
      });
    }
  });

  it("keeps summaries and answers when outgoing details are incompatible", () => {
    const incompatibleDetails = [
      { monthly_equivalents: {} },
      {
        monthly_equivalents: {
          all_sources: { legal_aid: "100" },
        },
      },
      {
        monthly_equivalents: {
          all_sources: { legal_aid: Number.POSITIVE_INFINITY },
        },
      },
    ];

    for (const disposableIncome of incompatibleDetails) {
      const savedResult = result({
        assessment: { disposable_income: disposableIncome },
      });
      const section = toMeansAssessmentSection(
        getGetApplicationResponseMock({
          eligibility: {
            data: { client_age: "standard" },
            result: savedResult,
          },
          meansAssessmentRequired: true,
        }),
      );

      expect(section?.calculations.status).to.equal("ready");
      expect(section?.outcomeSummary.totals?.items).to.have.length(1);
      expect(section?.answerSummaries.length).to.be.greaterThan(0);
      expect(section?.outgoingsBreakdown).to.deep.equal({
        heading: "Outgoings calculation",
        message: "Outgoings calculation details are unavailable.",
        status: "unavailable",
      });
    }
  });

  it("omits childcare when an adult has only statutory pay", () => {
    const mapped = breakdown(result(), {
      child_dependants: true,
      employment_status: "in_work",
      incomes: [{ income_type: "statutory_pay" }],
      partner: true,
      partner_employment_status: "unemployed",
      partner_incomes: [{ income_type: "statutory_pay" }],
    });

    expect(mapped?.status).to.equal("ready");
    if (mapped?.status === "ready") {
      expect(
        mapped.tables[0].rows.map(({ heading }) => heading),
      ).not.to.include("Childcare payments");
    }
  });

  it("omits outgoing tables when the category was not calculated", () => {
    const savedResult = result({
      disposableIncome: {
        proceeding_types: [
          { result: "not_calculated", upper_threshold: 999_999_999_999 },
        ],
      },
      otherSummary: {
        gross_income: {
          combined_total_gross_income: 100,
          proceeding_types: [{ result: "eligible", upper_threshold: 2_657 }],
        },
      },
    });

    expect(breakdown(savedResult)).to.deep.equal({
      status: "not-calculated",
    });
  });

  it("shows housing hints at the saved cap without applying it", () => {
    const housingHint = (allowedHousingCosts: number, data = {}) => {
      const mapped = breakdown(
        result({
          disposableIncome: { allowed_housing_costs: allowedHousingCosts },
        }),
        data,
      );
      if (mapped?.status !== "ready") {
        throw new Error("Expected outgoing details to be ready");
      }
      return mapped.tables[0].rows.find(
        ({ heading }) => heading === "Housing payments",
      );
    };

    expect(housingHint(544.99)?.additionalHint).to.equal(undefined);
    expect(housingHint(545)?.additionalHint).to.equal(
      "Housing costs are capped at £545 for single clients without dependants",
    );
    expect(housingHint(545.01, { partner: true })?.additionalHint).to.equal(
      undefined,
    );
    expect(
      housingHint(545.01, { adult_dependants: true })?.additionalHint,
    ).to.equal(undefined);
    expect(
      housingHint(544.99, { property_owned: "shared_ownership" })?.hint,
    ).to.equal(
      "Rent and mortgage costs minus any Housing Benefit payments your client gets",
    );
  });
});