/* eslint-disable @typescript-eslint/no-magic-numbers -- synthetic saved result values */
import { expect } from "chai";
import { before, describe, it } from "mocha";
import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";

import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

function savedProperty(overrides: Record<string, unknown>) {
  return {
    assessed_equity: 90_000,
    main_home_equity_disregard: 0,
    net_equity: 150_000,
    outstanding_mortgage: 0,
    percentage_owned: 100,
    smod_allowance: 0,
    transaction_allowance: 0,
    value: 90_000,
    ...overrides,
  };
}

function mappedSection(
  result: Record<string, unknown>,
  data: Record<string, unknown> = {},
) {
  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: { data, result },
      meansAssessmentRequired: true,
    }),
  );
}

function mappedCapital(result: Record<string, unknown>) {
  return mappedSection(result)?.calculationBreakdowns.find(
    ({ heading }) => heading === "Capital calculation",
  );
}

function cellText(cell: { html?: string; text?: string }): string {
  return (cell.text ?? cell.html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("toMeansAssessmentSection property calculation", () => {
  before(initializeI18nextSync);

  it("presents saved properties in CCQ order and ownership layouts", () => {
    const result = {
      assessment: {
        capital: {
          capital_items: {
            properties: {
              main_home: savedProperty({
                assessed_equity: 93_456.78,
                main_home_equity_disregard: 15_000,
                net_equity: 155_761.3,
                outstanding_mortgage: 100_000,
                percentage_owned: 63.6,
                smod_allowance: 500,
                transaction_allowance: 7_500,
                value: 300_000,
              }),
              additional_properties: [
                savedProperty({
                  assessed_equity: 45_000,
                  value: 50_000,
                }),
                savedProperty({
                  assessed_equity: 12_345.67,
                  percentage_owned: 49.6,
                  value: 75_000,
                }),
              ],
            },
          },
        },
        partner_capital: {
          capital_items: {
            properties: {
              additional_properties: [
                savedProperty({
                  assessed_equity: 21_000,
                  main_home_equity_disregard: 2_000,
                  net_equity: 35_000,
                  percentage_owned: 50,
                  smod_allowance: 1_000,
                  value: 70_000,
                }),
              ],
            },
          },
        },
      },
      result_summary: {
        capital: {
          combined_assessed_capital: 126_802.45,
          proceeding_types: [
            { result: "eligible", upper_threshold: 999_999_999_999 },
          ],
        },
        overall_result: { result: "eligible" },
      },
    };
    const capital = mappedCapital(result);

    expect(capital).not.to.equal(undefined);
    expect(capital?.description).to.deep.equal([
      "The calculations below assess the value of any property the client and their partner own.",
      "The assessed values are used to calculate the total disposable capital for your client and their partner.",
    ]);
    expect(capital?.tables.map(({ caption }) => caption)).to.deep.equal([
      "Home client lives in",
      "Client other property 1",
      "Client other property 2",
      "Partner other property 1",
    ]);
    expect(capital?.tables[0]?.rows[0]?.[0]).to.deep.equal({
      classes: "app-calculation__row-heading",
      text: "Estimated value",
    });
    expect(capital?.tables[0]?.rows[1]?.[0]).to.deep.equal({
      classes: "app-calculation__row-heading",
      text: "Outstanding mortgage",
    });
    expect(capital?.tables[0]?.rows[4]?.[0]).to.deep.equal({
      classes: "app-calculation__row-heading",
      text: "Disputed asset disregard",
    });

    expect(capital?.tables[0].rows.map((row) => row.map(cellText))).to.deep.equal([
      ["Estimated value", "£300,000.00"],
      ["Outstanding mortgage", "-£100,000.00"],
      ["Deductions 3% of property value deducted for cost of sale", "-£7,500.00"],
      ["64% share of home equity", "£155,761.30"],
      ["Disputed asset disregard", "-£500.00"],
      ["Other disregards Applied to the home equity and capped at £100,000", "-£15,000.00"],
      ["Assessed value", "£93,456.78"],
    ]);
    expect(capital?.tables[1].rows.map((row) => row.map(cellText))).to.deep.equal([
      ["Value", "£50,000.00"],
      ["Assessed value", "£45,000.00"],
    ]);
    expect(capital?.tables[2].rows.map((row) => row.map(cellText))).to.deep.equal([
      ["Value", "£75,000.00"],
      ["Assessed value Client’s 50% share of home equity", "£12,345.67"],
    ]);
    expect(capital?.tables[3].rows.map((row) => row.map(cellText))).to.deep.equal([
      ["Value", "£70,000.00"],
      ["50% share of home equity", "£35,000.00"],
      ["Disputed asset disregard", "-£1,000.00"],
      ["Other disregards Applied to the home equity and capped at £100,000", "-£2,000.00"],
      ["Assessed value", "£21,000.00"],
    ]);
  });

  it("omits zero main homes and preserves missing saved property values", () => {
    const capital = mappedCapital({
      assessment: {
        capital: {
          capital_items: {
            properties: {
              additional_properties: [
                savedProperty({
                  assessed_equity: null,
                  outstanding_mortgage: null,
                  value: null,
                }),
              ],
              main_home: savedProperty({ value: 0 }),
              vehicles: "ignored stale controlled-work data",
            },
          },
        },
      },
      result_summary: {
        capital: {
          combined_assessed_capital: 50,
          proceeding_types: [{ result: "eligible", upper_threshold: 100 }],
        },
        overall_result: { result: "eligible" },
      },
    });

    expect(capital?.tables.map(({ caption }) => caption)).to.deep.equal([
      "Client other property 1",
    ]);
    expect(capital?.tables[0].rows.map((row) => row.map(cellText))).to.deep.equal([
      ["Value", "Not applicable"],
      ["Outstanding mortgage", "Not applicable"],
      ["Assessed value", "Not applicable"],
    ]);
  });

  it("isolates malformed properties and preserves valid summaries and answers", () => {
    const section = mappedSection(
      {
        assessment: {
          capital: {
            capital_items: {
              properties: {
                additional_properties: [
                  savedProperty({ percentage_owned: "50" }),
                ],
              },
            },
          },
        },
        result_summary: {
          capital: {
            combined_assessed_capital: 25,
            proceeding_types: [{ result: "eligible", upper_threshold: 100 }],
          },
          overall_result: { result: "eligible" },
        },
      },
      { client_age: "standard" },
    );

    expect(section?.calculations.status).to.equal("ready");
    expect(section?.outcomeSummary.totals).not.to.equal(null);
    expect(section?.answerSummaries.length).to.be.greaterThan(0);
    expect(section?.calculationBreakdowns).to.deep.equal([
      {
        description: [],
        heading: "Capital calculation",
        message: "Capital calculation details are unavailable.",
        tables: [],
      },
    ]);
  });

  it("omits absent property tables and uncalculated capital details", () => {
    const absentProperties = mappedCapital({
      result_summary: {
        capital: {
          combined_assessed_capital: 0,
          proceeding_types: [{ result: "eligible", upper_threshold: 100 }],
        },
        overall_result: { result: "eligible" },
      },
    });
    const uncalculated = mappedCapital({
      result_summary: {
        capital: {
          proceeding_types: [
            { result: "not_calculated", upper_threshold: 100 },
          ],
        },
        gross_income: {
          combined_total_gross_income: 0,
          proceeding_types: [{ result: "eligible", upper_threshold: 100 }],
        },
        overall_result: { result: "eligible" },
      },
    });

    expect(absentProperties).to.deep.equal({
      description: [
        "The calculations below assess the value of any property the client owns.",
        "The assessed values are used to calculate the total disposable capital for your client.",
      ],
      heading: "Capital calculation",
      message: null,
      tables: [],
    });
    expect(uncalculated).to.equal(undefined);
  });
});
