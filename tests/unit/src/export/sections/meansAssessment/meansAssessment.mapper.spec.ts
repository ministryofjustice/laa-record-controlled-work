import { expect } from "chai";
import { describe, it } from "mocha";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
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

function mapSection(
  result: null | Record<string, unknown>,
  data: null | Record<string, unknown> = {},
  meansAssessmentRequired: boolean | null | undefined = true,
) {
  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: { data, result },
      meansAssessmentRequired,
    }),
  );
}

describe("toMeansAssessmentSection", () => {
  it("returns unavailable calculations for null or empty results", () => {
    for (const result of [null, {}]) {
      expect(mapSection(result)?.calculations).to.deep.equal({
        status: "unavailable",
      });
    }
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

  it("keeps explicitly uncalculated proceeding categories available", () => {
    const result = {
      result_summary: {
        capital: {
          proceeding_types: [
            { result: "not_calculated", upper_threshold: 0 },
          ],
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

  for (const data of [
    { passporting: true },
    { asylum_support: true, immigration_or_asylum: true },
    {
      passporting: false,
      asylum_support: true,
      immigration_or_asylum: true,
    },
    {
      aggregated_means: false,
      client_age: "under_18",
      under_eighteen_assets: false,
      regular_income: false,
    },
    {
      aggregated_means: false,
      client_age: "under_18",
      controlled_legal_representation: false,
      under_eighteen_assets: false,
      regular_income: false,
    },
  ]) {
    it("accepts a saved eligible exemption or passporting result without categories", () => {
      const result = {
        result_summary: { overall_result: { result: "eligible" } },
      };
      const calculations = mapSection(result, data)?.calculations;

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

  for (const meansAssessmentRequired of [null, undefined]) {
    it(`keeps a valid assessment when meansAssessmentRequired is ${String(meansAssessmentRequired)}`, () => {
      expect(
        mapSection(CALCULATED_RESULT, {}, meansAssessmentRequired)?.calculations
          .status,
      ).to.equal("ready");
    });
  }
});