import { expect } from "chai";
import { before, describe, it } from "mocha";

import {
  MeansAssessmentScenarioName,
  meansAssessmentScenarios,
} from "#tests/fixtures/meansAssessment/meansAssessment.fixtures.js";
import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const CALCULATED_RESULT = {
  result_summary: {
    capital: {
      combined_assessed_capital: 0,
      proceeding_types: [
        { result: "eligible", upper_threshold: 999_999_999_999 },
      ],
    },
    disposable_income: {
      combined_total_disposable_income: 0,
      proceeding_types: [{ result: "eligible", upper_threshold: 0 }],
    },
    gross_income: {
      combined_total_gross_income: 999.99,
      proceeding_types: [{ result: "eligible", upper_threshold: 1_000 }],
    },
    overall_result: {
      capital_contribution: 0,
      income_contribution: 0,
      result: "eligible",
    },
  },
};

interface SectionApplicationOverrides {
  data?: null | Record<string, unknown>;
  meansAssessmentRequired?: boolean | null | undefined;
}

function mapSection(
  result: null | Record<string, unknown>,
  { data = {}, ...applicationOverrides }: SectionApplicationOverrides = {},
) {
  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: { data, result },
      meansAssessmentRequired: true,
      ...applicationOverrides,
    }),
  );
}

function mapScenario(name: MeansAssessmentScenarioName) {
  const scenario = meansAssessmentScenarios[name]();

  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: scenario.eligibility,
      meansAssessmentRequired: scenario.meansAssessmentRequired,
    }),
  );
}

describe("toMeansAssessmentSection", () => {
  before(initializeI18nextSync);

  it("omits calculation breakdowns when results are unavailable or exempt", () => {
    for (const name of [
      MeansAssessmentScenarioName.MissingEligibility,
      MeansAssessmentScenarioName.Passporting,
      MeansAssessmentScenarioName.Under18NoMeans,
      MeansAssessmentScenarioName.UnavailableResult,
    ]) {
      expect(mapScenario(name)?.calculationBreakdowns, name).to.deep.equal([]);
    }
  });

  it("presents breakdowns in income, outgoings, and capital order", () => {
    expect(mapSection(CALCULATED_RESULT)?.calculationBreakdowns).to.deep.equal([
      {
        description: [],
        heading: "Income calculation",
        message: "Income calculation details are unavailable.",
        tables: [],
      },
      {
        description: [],
        heading: "Outgoings calculation",
        message: "Outgoings calculation details are unavailable.",
        tables: [],
      },
      {
        description: [
          "The calculations below assess the value of any property the client owns.",
          "The assessed values are used to calculate the total disposable capital for your client.",
        ],
        heading: "Capital calculation",
        message: "Capital calculation details are unavailable.",
        tables: [],
      },
    ]);
  });

  it("prepares income table captions, row headers and total emphasis", () => {
    const breakdown = mapScenario(
      MeansAssessmentScenarioName.IncomeBreakdownReady,
    )?.calculationBreakdowns.find((item) => item.heading === "Income calculation");

    expect(breakdown?.message).to.equal(null);
    expect(breakdown?.tables.map((table) => table.caption)).to.deep.equal([
      "Client's monthly income",
      "Total",
    ]);
    expect(breakdown?.tables[0]?.firstCellIsHeader).to.equal(true);
    expect(breakdown?.tables[0]?.rows[0]?.[0]).to.deep.equal({
      classes: "app-calculation__row-heading",
      text: "Employment income",
    });
    expect(breakdown?.tables[0]?.rows[1]?.[0]).to.deep.equal({
      classes: "app-calculation__row-heading",
      html: 'Benefits received <span class="govuk-hint govuk-!-margin-bottom-0">This does not include Housing Benefit</span>',
    });
    expect(breakdown?.tables[1]?.rows[0]?.map((cell) => cell.classes)).to.deep.equal([
      "app-calculation__row-heading app-calculation__cell--emphasis",
      "app-calculation__amount app-calculation__cell--emphasis",
    ]);
  });

  it("returns unavailable calculations for null or empty results", () => {
    for (const result of [null, {}]) {
      expect(mapSection(result)?.calculations).to.deep.equal({
        status: "unavailable",
      });
    }
  });

  it("keeps calculated sections when another section total is null", () => {
    const result = {
      result_summary: {
        disposable_income: {
          combined_total_disposable_income: 100,
          proceeding_types: [{ result: "eligible", upper_threshold: 200 }],
        },
        gross_income: {
          combined_total_gross_income: null,
          proceeding_types: [{ result: "eligible", upper_threshold: 1_000 }],
        },
        overall_result: { result: "eligible" },
      },
    };

    expect(mapSection(result)?.calculations).to.deep.equal({
      capital: { status: "not_calculated" },
      capitalContribution: null,
      disposableIncome: {
        noUpperThreshold: false,
        outcome: "eligible",
        status: "calculated",
        total: 100,
        upperThreshold: 200,
      },
      grossIncome: {
        noUpperThreshold: false,
        outcome: "eligible",
        status: "calculated",
        total: null,
        upperThreshold: 1_000,
      },
      incomeContribution: null,
      outcome: "eligible",
      status: "ready",
    });
  });

  it("returns unavailable calculations when a saved total is malformed", () => {
    const result = {
      result_summary: {
        gross_income: {
          combined_total_gross_income: "not-a-number",
          proceeding_types: [{ result: "eligible", upper_threshold: 1_000 }],
        },
        overall_result: { result: "eligible" },
      },
    };

    expect(mapSection(result)?.calculations).to.deep.equal({
      status: "unavailable",
    });
  });

  for (const outcome of ["ineligible", "partially_eligible"]) {
    it(`does not present ${outcome} as a supported result`, () => {
      const result = {
        result_summary: { overall_result: { result: outcome } },
      };

      expect(mapSection(result)?.calculations).to.deep.equal({
        status: "unavailable",
      });
    });
  }

  it("maps saved totals, zero values, unlimited thresholds and adjacent pence", () => {
    const calculations = mapSection(CALCULATED_RESULT)?.calculations;

    expect(calculations).to.deep.equal({
      capital: {
        noUpperThreshold: true,
        outcome: "eligible",
        status: "calculated",
        total: 0,
        upperThreshold: 999_999_999_999,
      },
      capitalContribution: 0,
      disposableIncome: {
        noUpperThreshold: false,
        outcome: "eligible",
        status: "calculated",
        total: 0,
        upperThreshold: 0,
      },
      grossIncome: {
        noUpperThreshold: false,
        outcome: "eligible",
        status: "calculated",
        total: 999.99,
        upperThreshold: 1_000,
      },
      incomeContribution: 0,
      outcome: "eligible",
      status: "ready",
    });
  });

  it("presents the three saved totals in export order", () => {
    expect(
      mapScenario(MeansAssessmentScenarioName.Baseline)?.outcomeSummary.totals,
    ).to.deep.equal({
      heading: "Your client's key eligibility totals",
      items: [
        {
          amount: "£0",
          detail: "Below upper limit (£2,657)",
          heading: "Gross monthly income",
        },
        {
          amount: "£0",
          detail: "Eligible",
          heading: "Disposable monthly income",
        },
        {
          amount: "£0",
          detail: "No upper limit applies",
          heading: "Disposable capital",
        },
      ],
    });
  });

  it("omits uncalculated totals and keeps saved null totals unavailable", () => {
    expect(
      mapScenario(MeansAssessmentScenarioName.CalculationStates)?.outcomeSummary
        .totals,
    ).to.deep.equal({
      heading: "Your client's key eligibility totals",
      items: [
        {
          amount: "Not available",
          detail: null,
          heading: "Gross monthly income",
        },
        {
          amount: "£0",
          detail: "No upper limit applies",
          heading: "Disposable capital",
        },
      ],
    });
  });

  it("shows no totals when saved calculations are unavailable or exempt", () => {
    for (const name of [
      MeansAssessmentScenarioName.AsylumSupport,
      MeansAssessmentScenarioName.MissingEligibility,
      MeansAssessmentScenarioName.Passporting,
      MeansAssessmentScenarioName.Under18ControlledClr,
      MeansAssessmentScenarioName.Under18NoMeans,
      MeansAssessmentScenarioName.UnavailableResult,
    ]) {
      expect(mapScenario(name)?.outcomeSummary.totals, name).to.equal(null);
    }
  });

  it("keeps absent calculation categories uncalculated", () => {
    const result = {
      result_summary: {
        gross_income: {
          combined_total_gross_income: 500,
          proceeding_types: [{ result: "eligible", upper_threshold: 1_000 }],
        },
        overall_result: { result: "eligible" },
      },
    };

    const calculations = mapSection(result)?.calculations;

    expect(calculations).to.have.property("status", "ready");
    if (calculations?.status === "ready") {
      expect(calculations.disposableIncome).to.deep.equal({
        status: "not_calculated",
      });
      expect(calculations.capital).to.deep.equal({ status: "not_calculated" });
    }
  });

  it("marks explicitly uncalculated categories as not calculated", () => {
    const result = {
      result_summary: {
        capital: {
          proceeding_types: [{ result: "not_calculated", upper_threshold: 0 }],
        },
        gross_income: {
          combined_total_gross_income: 500,
          proceeding_types: [{ result: "eligible", upper_threshold: 1_000 }],
        },
        overall_result: { result: "eligible" },
      },
    };

    const calculations = mapSection(result)?.calculations;

    expect(calculations?.status).to.equal("ready");
    if (calculations?.status === "ready") {
      expect(calculations.capital).to.deep.equal({ status: "not_calculated" });
    }
  });

  it("floors negative assessed capital at zero", () => {
    const result = {
      result_summary: {
        capital: {
          combined_assessed_capital: -250,
          proceeding_types: [{ result: "eligible", upper_threshold: 1_000 }],
        },
        gross_income: {
          combined_total_gross_income: 500,
          proceeding_types: [{ result: "eligible", upper_threshold: 1_000 }],
        },
        overall_result: { result: "eligible" },
      },
    };

    const calculations = mapSection(result)?.calculations;

    expect(calculations?.status).to.equal("ready");
    if (calculations?.status === "ready") {
      expect(calculations.capital).to.have.property("total", 0);
    }
  });

  it("prepares saved outcome and totals for display", () => {
    expect(mapSection(CALCULATED_RESULT)?.outcomeSummary).to.deep.equal({
      heading: "Means assessment",
      outcome: {
        contributions: [],
        description:
          "Your client qualifies financially for civil legal aid based on the information you entered. Before you (or a provider of advice or services funded by legal aid) proceed with your client's case, it must also be within scope for legal aid and satisfy the relevant merits criteria set out in the relevant legislation and guidance. These calculations were made in line with the latest version of the Lord Chancellor's Guidance on Determining Financial Eligibility for Controlled Work.",
        heading:
          "Your client is financially eligible for controlled work and family mediation.",
      },
      totals: {
        heading: "Your client's key eligibility totals",
        items: [
          {
            amount: "£999.99",
            detail: "Below upper limit (£1,000)",
            heading: "Gross monthly income",
          },
          {
            amount: "£0",
            detail: "Eligible",
            heading: "Disposable monthly income",
          },
          {
            amount: "£0",
            detail: "No upper limit applies",
            heading: "Disposable capital",
          },
        ],
      },
      yourAnswersHeading: "Your answers",
    });
  });

  it("shows a neutral outcome and no totals when calculations are unavailable", () => {
    expect(mapSection(null)?.outcomeSummary).to.deep.equal({
      heading: "Means assessment",
      outcome: {
        contributions: [],
        description: "Saved answer summaries are shown below.",
        heading: "Financial eligibility outcome unavailable.",
      },
      totals: null,
      yourAnswersHeading: "Your answers",
    });
  });

  it("does not show a limit claim when the saved total is unavailable", () => {
    const result = {
      result_summary: {
        gross_income: {
          combined_total_gross_income: null,
          proceeding_types: [{ result: "eligible", upper_threshold: 1_000 }],
        },
        overall_result: { result: "eligible" },
      },
    };

    expect(mapSection(result)?.outcomeSummary.totals?.items[0]).to.deep.equal({
      amount: "Not available",
      detail: null,
      heading: "Gross monthly income",
    });
  });

  it("shows saved contribution amounts without deriving them", () => {
    const result = {
      result_summary: {
        disposable_income: {
          combined_total_disposable_income: 100,
          proceeding_types: [
            { result: "contribution_required", upper_threshold: 733 },
          ],
        },
        gross_income: {
          combined_total_gross_income: 500,
          proceeding_types: [{ result: "eligible", upper_threshold: 2_657 }],
        },
        overall_result: {
          capital_contribution: 125.5,
          income_contribution: 25,
          result: "contribution_required",
        },
      },
    };

    expect(mapSection(result)?.outcomeSummary.outcome).to.deep.equal({
      contributions: [
        "Monthly income contribution: £25",
        "Capital contribution: £125.50",
      ],
      description:
        "The case must also be in scope and meet relevant merits criteria.",
      heading:
        "Your client is financially eligible for controlled work and family mediation, with a contribution.",
    });
  });

  for (const { data, name } of [
    { name: "passporting", data: { passporting: true } },
    {
      name: "asylum support",
      data: { asylum_support: true, immigration_or_asylum: true },
    },
    {
      name: "asylum support with passporting false",
      data: {
        passporting: false,
        asylum_support: true,
        immigration_or_asylum: true,
      },
    },
    {
      name: "under-18 with no aggregated means or regular income",
      data: {
        aggregated_means: false,
        client_age: "under_18",
        under_eighteen_assets: false,
        regular_income: false,
      },
    },
    {
      name: "under-18 with no controlled legal representation",
      data: {
        aggregated_means: false,
        client_age: "under_18",
        controlled_legal_representation: false,
        under_eighteen_assets: false,
        regular_income: false,
      },
    },
  ] satisfies Array<{ data: Record<string, unknown>; name: string }>) {
    it(`accepts a saved exemption or passporting result without categories for ${name}`, () => {
      const result = {
        result_summary: { overall_result: { result: "eligible" } },
      };
      const calculations = mapSection(result, { data })?.calculations;

      expect(calculations).to.deep.equal({
        capital: { status: "not_calculated" },
        capitalContribution: null,
        disposableIncome: { status: "not_calculated" },
        grossIncome: { status: "not_calculated" },
        incomeContribution: null,
        outcome: "eligible",
        status: "ready",
      });
    });
  }

  it("does not accept an ordinary outcome with no calculated categories", () => {
    const result = {
      result_summary: { overall_result: { result: "eligible" } },
    };

    expect(mapSection(result)?.calculations).to.deep.equal({
      status: "unavailable",
    });
  });

  for (const { name, value } of [
    { name: "false", value: false },
    { name: "null", value: null },
    { name: "undefined", value: undefined },
    { name: "true", value: true },
  ] satisfies Array<{
    name: string;
    value: boolean | null | undefined;
  }>) {
    it(`handles an explicitly ${name} means assessment required flag`, () => {
      const section = mapSection(CALCULATED_RESULT, {
        meansAssessmentRequired: value,
      });

      if (value === false) {
        expect(section).to.equal(null);
      } else {
        expect(section?.calculations.status).to.equal("ready");
      }
    });
  }
});
