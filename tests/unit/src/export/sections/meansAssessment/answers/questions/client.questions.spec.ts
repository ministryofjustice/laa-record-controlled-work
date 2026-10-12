import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

function summaries(data: EligibilityData) {
  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: {
        data: { adult_dependants: false, child_dependants: false, ...data },
        result: null,
      },
      meansAssessmentRequired: true,
    }),
  )?.answerSummaries.filter((summary) => summary.heading === "Client details");
}

describe("saved client answers", () => {
  before(initializeI18nextSync);

  for (const [age, display] of [
    ["under_18", "Under 18"],
    ["standard", "18 to 59"],
    ["over_60", "60 or over"],
  ]) {
    it(`shows the saved ${age} age choice and explicit false answers`, () => {
      expect(
        summaries({
          aggregated_means: true,
          client_age: age,
          controlled_legal_representation: false,
          immigration_or_asylum: false,
          level_of_help: "controlled",
          partner: false,
          passporting: false,
        }),
      ).to.deep.equal([
        {
          heading: "Client details",
          rows: [
            { key: "What age is your client?", value: display },
            { key: "Does your client have a partner?", value: "No" },
            {
              key: "Does your client receive a passporting benefit?",
              value: "No",
            },
          ],
        },
      ]);
    });
  }

  it("keeps partner and passporting answers in saved order", () => {
    expect(
      summaries({
        client_age: "over_60",
        immigration_or_asylum: false,
        level_of_help: "controlled",
        partner: true,
        passporting: true,
      }),
    ).to.deep.equal([
      {
        heading: "Client details",
        rows: [
          { key: "What age is your client?", value: "60 or over" },
          { key: "Does your client have a partner?", value: "Yes" },
          {
            key: "Does your client receive a passporting benefit?",
            value: "Yes",
          },
        ],
      },
    ]);
  });

  for (const route of [
    { client_age: "under_18", controlled_legal_representation: true },
    {
      aggregated_means: false,
      client_age: "under_18",
      controlled_legal_representation: false,
      regular_income: false,
      under_eighteen_assets: false,
    },
    {
      asylum_support: true,
      client_age: "standard",
      immigration_or_asylum: true,
    },
  ] satisfies EligibilityData[]) {
    it("hides stale applicant answers on a non-means-tested route", () => {
      expect(
        summaries({
          ...route,
          level_of_help: "controlled",
          partner: true,
          passporting: true,
        }),
      ).to.deep.equal([
        {
          heading: "Client details",
          rows: [
            {
              key: "What age is your client?",
              value: route.client_age === "under_18" ? "Under 18" : "18 to 59",
            },
          ],
        },
      ]);
    });
  }

  for (const route of [
    {
      aggregated_means: true,
      regular_income: false,
      under_eighteen_assets: false,
    },
    {
      aggregated_means: false,
      regular_income: true,
      under_eighteen_assets: false,
    },
    {
      aggregated_means: false,
      regular_income: false,
      under_eighteen_assets: true,
    },
  ] satisfies EligibilityData[]) {
    it("keeps applicant answers on a means-tested under-eighteen route", () => {
      expect(
        summaries({
          ...route,
          client_age: "under_18",
          controlled_legal_representation: false,
          immigration_or_asylum: false,
          level_of_help: "controlled",
          partner: false,
          passporting: false,
        }),
      ).to.deep.equal([
        {
          heading: "Client details",
          rows: [
            { key: "What age is your client?", value: "Under 18" },
            { key: "Does your client have a partner?", value: "No" },
            {
              key: "Does your client receive a passporting benefit?",
              value: "No",
            },
          ],
        },
      ]);
    });
  }

  for (const route of [
    { asylum_support: true, immigration_or_asylum: false },
    { asylum_support: false, immigration_or_asylum: true },
    {
      aggregated_means: false,
      controlled_legal_representation: true,
      regular_income: false,
      under_eighteen_assets: false,
    },
  ] satisfies EligibilityData[]) {
    it("ignores inactive exemption answers after route changes", () => {
      expect(
        summaries({
          ...route,
          client_age: "standard",
          level_of_help: "controlled",
          partner: false,
          passporting: false,
        }),
      ).to.deep.equal([
        {
          heading: "Client details",
          rows: [
            { key: "What age is your client?", value: "18 to 59" },
            { key: "Does your client have a partner?", value: "No" },
            {
              key: "Does your client receive a passporting benefit?",
              value: "No",
            },
          ],
        },
      ]);
    });
  }
});
