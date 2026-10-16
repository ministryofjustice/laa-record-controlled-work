import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import {
  MeansAssessmentScenarioName,
  meansAssessmentScenarios,
} from "#tests/fixtures/meansAssessment/meansAssessment.fixtures.js";
import {
  answerCards,
  expectedAnswerSummaries,
} from "#tests/unit/src/export/sections/meansAssessment/answers/answers.fixtures.js";
import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const ANSWERS = {
  adult_dependants: false,
  child_dependants: false,
  childcare_payments_relevant: false,
  client_age: "standard",
  employment_status: "unemployed",
  friends_or_family_relevant: false,
  immigration_or_asylum: false,
  investments_relevant: false,
  legal_aid_payments_relevant: false,
  level_of_help: "controlled",
  maintenance_relevant: false,
  maintenance_payments_relevant: false,
  other_relevant: false,
  partner: false,
  partner_childcare_payments_relevant: false,
  partner_legal_aid_payments_relevant: false,
  partner_maintenance_payments_relevant: false,
  passporting: false,
  pension_relevant: false,
  property_owned: "none",
  additional_property_owned: "none",
  property_or_lodger_relevant: false,
  receives_benefits: false,
  student_finance_relevant: false,
  valuables_relevant: false,
  housing_payments: 0,
  housing_payments_frequency: "monthly",
  housing_benefit_relevant: false,
} satisfies EligibilityData;

function application(overrides: Partial<Application> = {}): Application {
  return getGetApplicationResponseMock({
    eligibility: { data: ANSWERS, result: null },
    meansAssessmentRequired: true,
    ...overrides,
  });
}

function scenarioAnswers(name: MeansAssessmentScenarioName) {
  const scenario = meansAssessmentScenarios[name]();

  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: scenario.eligibility,
      meansAssessmentRequired: scenario.meansAssessmentRequired,
    }),
  )?.answerSummaries;
}

function scenarioCardValues(
  name: MeansAssessmentScenarioName,
  heading: string,
): null | string[] {
  const card = answerCards(scenarioAnswers(name)).find(
    (summary) => summary.heading === heading,
  );

  return card?.rows.map(({ value }) => value) ?? null;
}

describe("saved means answers", () => {
  before(initializeI18nextSync);

  it("preserves section relevance for each assessment scenario", () => {
    for (const createScenario of Object.values(meansAssessmentScenarios)) {
      const scenario = createScenario();

      const section = toMeansAssessmentSection(
        getGetApplicationResponseMock({
          eligibility: scenario.eligibility,
          meansAssessmentRequired: scenario.meansAssessmentRequired,
        }),
      );
      if (scenario.meansAssessmentRequired === false) {
        expect(section).to.equal(null);
      } else {
        expect(section).not.to.equal(null);
      }
    }
  });

  it("maps household values from saved entries", () => {
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.EmployedHousehold,
        "Number of dependants",
      ),
    ).to.deep.equal(["Yes", "2", "Yes", "1"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.EmployedHousehold,
        "Dependant 1 income",
      ),
    ).to.deep.equal(["Monthly", "£12.50"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.EmployedHousehold,
        "Dependant 2 income",
      ),
    ).to.deep.equal(["Every week", "£8.00"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.EmployedHousehold,
        "Client employment income 1",
      ),
    ).to.deep.equal([
      "A salary or wage",
      "Monthly",
      "£2,450.00",
      "£300.00",
      "£120.00",
    ]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.EmployedHousehold,
        "Client employment income 2",
      ),
    ).to.deep.equal([
      "Statutory Sick Pay or Statutory Maternity Pay",
      "Monthly",
      "£125.50",
      "£0.00",
      "£0.00",
    ]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.EmployedHousehold,
        "Partner employment income 1",
      ),
    ).to.deep.equal([
      "Self-employment income",
      "Every 4 weeks",
      "£1,800.00",
      "£210.00",
      "£80.00",
    ]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.EmployedHousehold,
        "Client benefit 2 details",
      ),
    ).to.deep.equal(["Disability benefit", "£22.00", "Every 4 weeks"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.EmployedHousehold,
        "Partner benefit 1 details",
      ),
    ).to.deep.equal(["Carer benefit", "£65.00", "Every 2 weeks"]);
  });

  it("maps client and partner conditional income and payment answers", () => {
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.OtherIncomeAndOutgoings,
        "Client other income",
      ),
    ).to.deep.equal([
      "Yes",
      "£40.00",
      "Monthly",
      "Yes",
      "£110.00",
      "Every week",
      "Yes",
      "£250.00",
      "Monthly",
      "Yes",
      "£100.00",
      "Every 4 weeks",
      "Yes",
      "£90.00",
      "Yes",
      "£35.00",
    ]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.OtherIncomeAndOutgoings,
        "Partner other income",
      ),
    ).to.deep.equal([
      "Yes",
      "£60.00",
      "Every 4 weeks",
      "Yes",
      "£90.00",
      "Monthly",
      "Yes",
      "£200.00",
      "Every 2 weeks",
      "Yes",
      "£80.00",
      "Monthly",
      "Yes",
      "£120.00",
      "Yes",
      "£25.00",
    ]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.OtherIncomeAndOutgoings,
        "Client outgoings and deductions",
      ),
    ).to.deep.equal([
      "Yes",
      "£180.00",
      "Every month",
      "Yes",
      "£50.00",
      "Every month",
      "Yes",
      "£20.00",
      "Every 4 weeks",
    ]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.OtherIncomeAndOutgoings,
        "Partner outgoings and deductions",
      ),
    ).to.deep.equal([
      "Yes",
      "£75.00",
      "Every 2 weeks",
      "Yes",
      "£30.00",
      "Every week",
      "Yes",
      "£15.00",
      "Every month",
    ]);
  });

  it("preserves housing, property, and asset values and ordering", () => {
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.FormattingVariants,
        "Housing costs",
      ),
    ).to.deep.equal(["£1,500.25", "Every 4 weeks", "£320.00", "Monthly"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.HousingMortgage,
        "Housing costs",
      ),
    ).to.deep.equal(["£950.00", "Every month"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.HousingSharedOwnership,
        "Housing costs",
      ),
    ).to.deep.equal([
      "£480.00",
      "Every month",
      "£320.00",
      "Every month",
      "£90.00",
      "Monthly",
    ]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.PropertiesAndAssets,
        "Client other property 1 details",
      ),
    ).to.deep.equal(["£125,000.00", "£65,000.00", "50%", "Yes"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.PropertiesAndAssets,
        "Client other property 2 details",
      ),
    ).to.deep.equal(["£80,000.00", "Yes", "£25,000.00", "25%"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.PropertiesAndAssets,
        "Client bank account 2",
      ),
    ).to.deep.equal(["£300.00", "Yes"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.PropertiesAndAssets,
        "Client assets",
      ),
    ).to.deep.equal(["Yes", "£4,500.00", "Yes", "Yes", "£2,250.00", "Yes"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.PropertiesAndAssets,
        "Partner other property 1 details",
      ),
    ).to.deep.equal(["£60,000.00", "£12,000.00", "50%"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.PropertiesAndAssets,
        "Partner bank account 1",
      ),
    ).to.deep.equal(["£700.00"]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.PropertiesAndAssets,
        "Partner assets",
      ),
    ).to.deep.equal(["Yes", "£1,800.00", "Yes", "£950.00"]);
  });

  it("formats saved pence and omits stale answers", () => {
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.FormattingVariants,
        "Client employment income 5",
      ),
    ).to.deep.equal([
      "A salary or wage",
      "Every 2 weeks",
      "£5,678.90",
      "£500.00",
      "£120.00",
    ]);
    expect(
      scenarioCardValues(
        MeansAssessmentScenarioName.FormattingVariants,
        "Client bank account 2",
      ),
    ).to.deep.equal(["£1,234.56"]);
    expect(
      scenarioAnswers(MeansAssessmentScenarioName.StaleInactiveAnswers),
    ).to.deep.equal(expectedAnswerSummaries);
  });

  it("omits income answer cards on passported and exempt routes", () => {
    for (const name of [
      MeansAssessmentScenarioName.AsylumSupport,
      MeansAssessmentScenarioName.Passporting,
      MeansAssessmentScenarioName.Under18ControlledClr,
      MeansAssessmentScenarioName.Under18NoMeans,
    ]) {
      expect(
        scenarioAnswers(name)
          ?.flatMap(({ cards }) => cards)
          .map(({ heading }) => heading)
          .filter((heading) => heading.includes("income")),
      ).to.deep.equal([]);
    }
    expect(
      scenarioAnswers(MeansAssessmentScenarioName.MissingEligibility),
    ).to.deep.equal([]);
  });

  it("groups relevant cards beneath ordered answer sections", () => {
    const section = toMeansAssessmentSection(application());

    expect(
      section?.answerSummaries.map(({ heading, cards }) => [
        heading,
        cards.map(({ heading: cardHeading }) => cardHeading),
      ]),
    ).to.deep.equal([
      ["Client details", ["Client age", "Partner and passporting"]],
      ["Dependants", ["Number of dependants"]],
      [
        "Client income",
        ["Employment status", "Client benefits", "Client other income"],
      ],
      ["Outgoings", ["Client outgoings and deductions"]],
      [
        "Housing and property",
        [
          "Home client usually lives in",
          "Housing costs",
          "Client other property",
        ],
      ],
      ["Assets", ["Client assets"]],
    ]);

    expect(section?.answerSummaries).to.deep.equal(expectedAnswerSummaries);
  });

  for (const { name, result } of [
    { name: "null result", result: null },
    { name: "empty result", result: {} },
    {
      name: "unsupported outcome",
      result: { result_summary: { overall_result: { result: "ineligible" } } },
    },
    {
      name: "malformed saved total",
      result: {
        result_summary: {
          gross_income: { combined_total_gross_income: "incompatible" },
          overall_result: { result: "eligible" },
        },
      },
    },
  ]) {
    it(`keeps saved summaries when calculations are unavailable for ${name}`, () => {
      const section = toMeansAssessmentSection(
        application({
          eligibility: { data: ANSWERS, result },
        }),
      );

      expect(section?.calculations).to.deep.equal({ status: "unavailable" });
      expect(section?.answerSummaries).to.deep.equal(expectedAnswerSummaries);
    });
  }

  it("ignores pending answers and operational metadata", () => {
    const section = toMeansAssessmentSection(
      application({
        eligibility: {
          data: {
            ...ANSWERS,
            api_response: { result: "eligible" },
            early_result: { result: "eligible", type: "gross_income" },
            feature_flags: { export: true },
            pending: {
              client_age: "over_60",
              partner: true,
              passporting: true,
            },
          },
          result: null,
        },
      }),
    );

    expect(section?.answerSummaries).to.deep.equal(expectedAnswerSummaries);
  });

  it("returns no summaries without saved eligibility", () => {
    const section = toMeansAssessmentSection(
      application({ eligibility: null }),
    );

    expect(section?.answerSummaries).to.deep.equal([]);
    expect(section?.calculations).to.deep.equal({ status: "unavailable" });
    expect(section?.outcomeSummary.outcome.heading).to.equal(
      "Financial eligibility outcome unavailable.",
    );
    expect(section?.outcomeSummary.totals).to.equal(null);
  });

  it("omits the whole section when means assessment is not required", () => {
    expect(
      toMeansAssessmentSection(application({ meansAssessmentRequired: false })),
    ).to.equal(null);
  });

  for (const { name, value } of [
    { name: "null", value: null },
    { name: "undefined", value: undefined },
  ]) {
    it(`keeps saved answers when the required flag is ${name}`, () => {
      expect(
        toMeansAssessmentSection(application({ meansAssessmentRequired: value }))
          ?.answerSummaries,
      ).to.deep.equal(expectedAnswerSummaries);
    });
  }

  it("preserves the saved passported calculation outcome", () => {
    const section = toMeansAssessmentSection(
      application({
        eligibility: {
          data: { ...ANSWERS, passporting: true },
          result: {
            result_summary: { overall_result: { result: "eligible" } },
          },
        },
      }),
    );

    expect(
      section?.answerSummaries.map(({ heading, cards }) => [
        heading,
        cards.map(({ heading: cardHeading }) => cardHeading),
      ]),
    ).to.deep.equal([
      ["Client details", ["Client age", "Partner and passporting"]],
      [
        "Housing and property",
        ["Home client usually lives in", "Client other property"],
      ],
      ["Assets", ["Client assets"]],
    ]);
    expect(section?.answerSummaries[0].cards[1].rows[1]).to.deep.equal({
      key: "Does your client receive a passporting benefit?",
      value: "Yes",
    });
    expect(section?.calculations).to.deep.equal({
      capital: { status: "not_calculated" },
      capitalContribution: null,
      disposableIncome: { status: "not_calculated" },
      grossIncome: { status: "not_calculated" },
      incomeContribution: null,
      outcome: "eligible",
      status: "ready",
    });
  });
});
