/* eslint-disable @typescript-eslint/no-magic-numbers -- synthetic saved result values */
/* eslint-disable jsdoc/require-jsdoc -- test helpers are self-describing */
import { expect } from "chai";
import { before, describe, it } from "mocha";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";

import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const CLIENT_CAPITAL = {
  combined_assessed_capital: 1_000,
  disputed_non_property_disregard: 40,
  pensioner_disregard_applied: 30,
  proceeding_types: [
    { result: "eligible", upper_threshold: 500_000 },
    { result: "eligible", upper_threshold: 450_000 },
  ],
  subject_matter_of_dispute_disregard: 20,
  total_capital: 1_234,
  total_capital_with_smod: 1_194,
  total_liquid: 200,
  total_non_liquid: 300,
  total_property: 734,
};

const PARTNER_CAPITAL = {
  pensioner_disregard_applied: 60,
  total_capital_with_smod: 500,
  total_liquid: 90,
  total_non_liquid: 100,
  total_property: 80,
};

function resultWithCapital(
  options: {
    assessmentPartnerCapital?: unknown;
    clientCapital?: Record<string, unknown>;
    partnerSummary?: Record<string, unknown>;
  } = {},
): Record<string, unknown> {
  const {
    assessmentPartnerCapital,
    clientCapital = CLIENT_CAPITAL,
    partnerSummary,
  } = options;

  const assessmentPartnerFields =
    assessmentPartnerCapital === undefined
      ? {}
      : { partner_capital: assessmentPartnerCapital };
  const partnerSummaryFields =
    partnerSummary === undefined ? {} : { partner_capital: partnerSummary };

  return {
    assessment: {
      capital: {
        capital_items: {
          properties: {
            additional_properties: [],
            main_home: null,
          },
        },
      },
      ...assessmentPartnerFields,
    },
    result_summary: {
      capital: clientCapital,
      ...partnerSummaryFields,
      overall_result: { result: "eligible" },
    },
  };
}

function mappedCapital(
  result: Record<string, unknown>,
  data: Record<string, unknown> = {},
) {
  const section = toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: { data, result },
      meansAssessmentRequired: true,
    }),
  );

  return section?.calculationBreakdowns.find(
    ({ heading }) => heading === "Capital calculation",
  );
}

function rowValues(table: {
  rows: Array<Array<{ html?: string; text?: string }>>;
}) {
  return table.rows.map(([heading, amount]) => [
    (heading?.text ?? heading?.html ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    amount?.text,
  ]);
}

describe("toMeansAssessmentSection disposable capital calculation", () => {
  before(initializeI18nextSync);

  it("maps saved single-client rows and does not infer partner from answers", () => {
    const capital = mappedCapital(
      resultWithCapital({
        assessmentPartnerCapital: {},
        partnerSummary: { total_property: "ignored stale data" },
      }),
      { partner: true },
    );

    expect(capital?.tables.map(({ caption }) => caption)).to.deep.equal([
      "Client's disposable capital",
      "Total",
    ]);
    expect(rowValues(capital!.tables[0]!)).to.deep.equal([
      ["Assessed property value", "£734.00"],
      ["Money in bank accounts", "£200.00"],
      ["Investments and valuables", "£300.00"],
      ["Total capital", "£1,234.00"],
      [
        "Disputed asset disregard Equal to the assessed value of all assets marked as disputed and capped at £100,000",
        "-£40.00",
      ],
      [
        "60 or over disregard (also known as pensioner disregard) Applied to remaining capital after disputed asset disregard has been applied, and up to a maximum of £100,000",
        "-£30.00",
      ],
    ]);
    expect(rowValues(capital!.tables[1]!)).to.deep.equal([
      ["Total assessed disposable capital", "£1,000.00"],
      ["Disposable capital upper limit", "£450,000.00"],
    ]);
  });

  it("maps partner tables and the pensioner table from saved result fields", () => {
    const capital = mappedCapital(
      resultWithCapital({
        assessmentPartnerCapital: { capital_items: {} },
        clientCapital: {
          ...CLIENT_CAPITAL,
          combined_assessed_capital: -12,
          total_capital: -150,
          total_capital_with_smod: -10,
        },
        partnerSummary: PARTNER_CAPITAL,
      }),
      { partner: false },
    );

    expect(capital?.tables.map(({ caption }) => caption)).to.deep.equal([
      "Client's disposable capital",
      "Partner's disposable capital",
      "60 or over disregard (also known as pensioner disregard)",
      "Total",
    ]);
    expect(rowValues(capital!.tables[0]!)).to.deep.equal([
      ["Assessed property value", "£734.00"],
      ["Money in bank accounts", "£200.00"],
      ["Investments and valuables", "£300.00"],
      ["Total capital", "-£150.00"],
      [
        "Disputed asset disregard Equal to the assessed value of all assets marked as disputed and capped at £100,000",
        "-£40.00",
      ],
      [
        "60 or over disregard (also known as pensioner disregard) Applied to remaining capital after disputed asset disregard has been applied, and up to a maximum of £100,000",
        "-£30.00",
      ],
      ["Disposable capital", "-£10.00"],
    ]);
    expect(rowValues(capital!.tables[2]!)).to.deep.equal([
      ["Total client and partner disposable capital", "£490.00"],
      ["60 or over disregard (also known as pensioner disregard)", "-£90.00"],
      ["Total assessed disposable capital", "£0.00"],
    ]);
    expect(rowValues(capital!.tables[3]!)).to.deep.equal([
      ["Total assessed disposable capital", "£0.00"],
      ["Disposable capital upper limit", "£450,000.00"],
    ]);
  });

  it("shows missing pensioner-sum operands as not applicable", () => {
    const capital = mappedCapital(
      resultWithCapital({
        assessmentPartnerCapital: { capital_items: {} },
        partnerSummary: {
          ...PARTNER_CAPITAL,
          pensioner_disregard_applied: null,
          total_capital_with_smod: null,
        },
      }),
    );

    const partnerRows = rowValues(capital!.tables[1]!);
    const pensionerRows = rowValues(capital!.tables[2]!);

    expect(partnerRows.at(-1)?.[1]).to.equal("Not applicable");
    expect(pensionerRows[0]?.[1]).to.equal("Not applicable");
    expect(pensionerRows[1]?.[1]).to.equal("Not applicable");
  });

  it("preserves valid property tables when disposable-capital details are malformed", () => {
    const result = resultWithCapital({
      clientCapital: {
        ...CLIENT_CAPITAL,
        total_liquid: "not a number",
      },
    });
    result.assessment = {
      capital: {
        capital_items: {
          properties: {
            additional_properties: [],
            main_home: {
              assessed_equity: 80,
              main_home_equity_disregard: 0,
              net_equity: 80,
              outstanding_mortgage: 0,
              percentage_owned: 100,
              smod_allowance: 0,
              transaction_allowance: 0,
              value: 80,
            },
          },
        },
      },
    };

    const capital = mappedCapital(result);
    expect(capital?.message).to.equal(
      "Capital calculation details are unavailable.",
    );
    expect(capital?.tables.map(({ caption }) => caption)).to.deep.equal([
      "Home client lives in",
    ]);
  });

  it("preserves disposable-capital tables when property details are malformed", () => {
    const result = resultWithCapital();
    result.assessment = {
      capital: {
        capital_items: {
          properties: {
            additional_properties: [
              {
                assessed_equity: 80,
                main_home_equity_disregard: 0,
                net_equity: 80,
                outstanding_mortgage: 0,
                percentage_owned: "50",
                smod_allowance: 0,
                transaction_allowance: 0,
                value: 80,
              },
            ],
            main_home: null,
          },
        },
      },
    };

    const capital = mappedCapital(result);
    expect(capital?.message).to.equal(
      "Capital calculation details are unavailable.",
    );
    expect(capital?.tables.map(({ caption }) => caption)).to.deep.equal([
      "Client's disposable capital",
      "Total",
    ]);
  });

  it("preserves zero values and formats missing or unlimited amounts safely", () => {
    const capital = mappedCapital(
      resultWithCapital({
        assessmentPartnerCapital: { capital_items: {} },
        clientCapital: {
          ...CLIENT_CAPITAL,
          combined_assessed_capital: 999_999_999_999,
          disputed_non_property_disregard: 0,
          pensioner_disregard_applied: 0,
          proceeding_types: [
            { result: "eligible", upper_threshold: 999_999_999_999 },
          ],
          subject_matter_of_dispute_disregard: 0,
          total_capital: 0,
          total_capital_with_smod: 0,
          total_liquid: null,
          total_non_liquid: undefined,
          total_property: 0,
        },
        partnerSummary: {
          pensioner_disregard_applied: 0,
          total_capital_with_smod: 0,
          total_liquid: 0,
          total_non_liquid: 0,
          total_property: 0,
        },
      }),
    );

    expect(capital?.tables.map(({ caption }) => caption)).to.deep.equal([
      "Client's disposable capital",
      "Partner's disposable capital",
      "Total",
    ]);
    const clientAmounts = rowValues(capital!.tables[0]!).map(
      ([, amount]) => amount,
    );
    const totalAmounts = rowValues(capital!.tables[2]!).map(
      ([, amount]) => amount,
    );

    expect(clientAmounts).to.deep.equal([
      "£0.00",
      "Not applicable",
      "Not applicable",
      "£0.00",
      "£0.00",
      "£0.00",
      "£0.00",
    ]);
    expect(totalAmounts).to.deep.equal([
      "Not applicable",
      "Not applicable",
    ]);
  });
});