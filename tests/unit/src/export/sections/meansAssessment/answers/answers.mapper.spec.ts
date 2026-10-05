import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";

import { toQuestionSectionSummaries } from "#/export/sections/meansAssessment/answers/answers.mapper.js";
import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const ANSWERS = {
  client_age: "standard",
  immigration_or_asylum: false,
  level_of_help: "controlled",
  partner: false,
  passporting: false,
} satisfies EligibilityData;

const SUMMARIES = [
  {
    heading: "Client details",
    rows: [
      { key: "What age is your client?", value: "18 to 59" },
      { key: "Does your client have a partner?", value: "No" },
      { key: "Does your client receive a passporting benefit?", value: "No" },
    ],
  },
];

function application(overrides: Partial<Application> = {}): Application {
  return getGetApplicationResponseMock({
    eligibility: { data: ANSWERS, result: null },
    meansAssessmentRequired: true,
    ...overrides,
  });
}

describe("question section summaries", () => {
  before(initializeI18nextSync);

  const section: QuestionSection<EligibilityData> = {
    answerContexts: (answers) => [answers],
    heading: "client.heading",
    questions: [
      {
        kind: "text",
        label: "client.age.label",
        select: () => "18 to 59",
      },
    ],
  };
  const summaries = [
    {
      heading: "Client details",
      rows: [{ key: "What age is your client?", value: "18 to 59" }],
    },
  ];

  it("includes sections and questions without relevance predicates", () => {
    expect(toQuestionSectionSummaries(ANSWERS, [section])).to.deep.equal(summaries);
  });

  it("creates one section summary per answer context", () => {
    const repeatedSection: QuestionSection<string> = {
      ...section,
      answerContexts: () => ["First", "Second"],
      questions: [
        {
          kind: "text",
          label: "client.age.label",
          select: (answerContext) => answerContext,
        },
        {
          kind: "boolean",
          label: "client.partner",
          select: () => false,
        },
      ],
    };

    expect(toQuestionSectionSummaries(ANSWERS, [repeatedSection])).to.deep.equal([
      {
        heading: "Client details",
        rows: [
          { key: "What age is your client?", value: "First" },
          { key: "Does your client have a partner?", value: "No" },
        ],
      },
      {
        heading: "Client details",
        rows: [
          { key: "What age is your client?", value: "Second" },
          { key: "Does your client have a partner?", value: "No" },
        ],
      },
    ]);
  });

  it("omits sections with explicitly false relevance", () => {
    expect(
      toQuestionSectionSummaries(ANSWERS, [
        {
          ...section,
          isRelevant: () => false,
        },
      ]),
    ).to.deep.equal([]);
  });

  it("keeps explicitly relevant answers and omits irrelevant questions", () => {
    expect(
      toQuestionSectionSummaries(ANSWERS, [
        {
          ...section,
          isRelevant: () => true,
          questions: [
            { ...section.questions[0], isRelevant: () => true },
            {
              kind: "boolean",
              label: "client.partner",
              isRelevant: () => false,
              select: () => false,
            },
          ],
        },
      ]),
    ).to.deep.equal(summaries);
  });
});

describe("saved means answers", () => {
  before(initializeI18nextSync);

  for (const result of [
    null,
    {},
    { result_summary: { overall_result: { result: "ineligible" } } },
    {
      result_summary: {
        gross_income: { combined_total_gross_income: "incompatible" },
        overall_result: { result: "eligible" },
      },
    },
  ]) {
    it("keeps saved summaries when calculations are unavailable", () => {
      const section = toMeansAssessmentSection(
        application({
          eligibility: { data: ANSWERS, result },
        }),
      );

      expect(section?.calculations).to.deep.equal({ status: "unavailable" });
      expect(section?.answerSummaries).to.deep.equal(SUMMARIES);
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

    expect(section?.answerSummaries).to.deep.equal(SUMMARIES);
  });

  it("returns no summaries without saved eligibility", () => {
    expect(
      toMeansAssessmentSection(application({ eligibility: null })),
    ).to.deep.equal({
      answerSummaries: [],
      calculations: { status: "unavailable" },
    });
  });

  it("omits the whole section when means assessment is not required", () => {
    expect(
      toMeansAssessmentSection(application({ meansAssessmentRequired: false })),
    ).to.equal(null);
  });

  for (const meansAssessmentRequired of [null, undefined]) {
    it("keeps saved answers when the required flag is unspecified", () => {
      expect(
        toMeansAssessmentSection(application({ meansAssessmentRequired }))
          ?.answerSummaries,
      ).to.deep.equal(SUMMARIES);
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

    expect(section?.answerSummaries).to.deep.equal([
      {
        heading: "Client details",
        rows: [
          ...SUMMARIES[0].rows.slice(0, 2),
          {
            key: "Does your client receive a passporting benefit?",
            value: "Yes",
          },
        ],
      },
    ]);
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
