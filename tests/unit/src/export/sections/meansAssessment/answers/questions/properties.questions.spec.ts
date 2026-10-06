import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const BASE_ANSWERS = {
  client_age: "standard",
  immigration_or_asylum: false,
  level_of_help: "controlled",
  partner: false,
  passporting: false,
  property_owned: "none",
  housing_payments: 0,
  housing_benefit_relevant: false,
  additional_property_owned: "none",
  partner_additional_property_owned: "none",
} satisfies EligibilityData;

function propertySummaries(overrides: Partial<EligibilityData> = {}) {
  return (
    toMeansAssessmentSection(
      getGetApplicationResponseMock({
        eligibility: {
          data: { ...BASE_ANSWERS, ...overrides },
          result: null,
        },
        meansAssessmentRequired: true,
      }),
    )?.answerSummaries.filter(
      ({ heading }) =>
        heading.startsWith("Client other property") ||
        heading.startsWith("Partner other property"),
    ) ?? []
  );
}

describe("saved additional property answers", () => {
  before(initializeI18nextSync);

  it("preserves client property order and uses the first selector before inline mortgage answers", () => {
    expect(
      propertySummaries({
        additional_property_owned: "with_mortgage",
        additional_properties: [
          {
            house_value: 120000,
            inline_owned_with_mortgage: false,
            mortgage: 50000,
            percentage_owned: 100,
          },
          {
            house_value: 120000,
            inline_owned_with_mortgage: false,
            mortgage: 80000,
            percentage_owned: 50,
          },
          {
            house_value: 75000,
            inline_owned_with_mortgage: true,
            mortgage: 20000,
            percentage_owned: 75,
          },
        ],
      }),
    ).to.deep.equal([
      {
        heading: "Client other property",
        rows: [
          {
            key: "Does your client own any other property, a holiday home or land?",
            value: "Yes, with a mortgage or loan",
          },
        ],
      },
      {
        heading: "Client other property 1 details",
        rows: [
          {
            key: "How much is the property, holiday home or land worth?",
            value: "£120,000.00",
          },
          { key: "Value of outstanding mortgage", value: "£50,000.00" },
          { key: "What percentage does your client own?", value: "100%" },
        ],
      },
      {
        heading: "Client other property 2 details",
        rows: [
          {
            key: "How much is the property, holiday home or land worth?",
            value: "£120,000.00",
          },
          {
            key: "Is there an outstanding mortgage on the property, holiday home or land?",
            value: "No",
          },
          { key: "What percentage does your client own?", value: "50%" },
        ],
      },
      {
        heading: "Client other property 3 details",
        rows: [
          {
            key: "How much is the property, holiday home or land worth?",
            value: "£75,000.00",
          },
          {
            key: "Is there an outstanding mortgage on the property, holiday home or land?",
            value: "Yes",
          },
          { key: "Value of outstanding mortgage", value: "£20,000.00" },
          { key: "What percentage does your client own?", value: "75%" },
        ],
      },
    ]);
  });

  it("hides stale first-entry mortgage answers for outright ownership", () => {
    expect(
      propertySummaries({
        additional_property_owned: "outright",
        additional_properties: [
          {
            house_value: 60000,
            inline_owned_with_mortgage: true,
            mortgage: 30000,
            percentage_owned: 100,
          },
        ],
      }),
    ).to.deep.equal([
      {
        heading: "Client other property",
        rows: [
          {
            key: "Does your client own any other property, a holiday home or land?",
            value: "Yes, owned outright",
          },
        ],
      },
      {
        heading: "Client other property 1 details",
        rows: [
          {
            key: "How much is the property, holiday home or land worth?",
            value: "£60,000.00",
          },
          { key: "What percentage does your client own?", value: "100%" },
        ],
      },
    ]);
  });

  it("hides saved entries after ownership is removed", () => {
    expect(
      propertySummaries({
        additional_properties: [
          { house_value: 80000, mortgage: 20000, percentage_owned: 100 },
        ],
      }),
    ).to.deep.equal([
      {
        heading: "Client other property",
        rows: [
          {
            key: "Does your client own any other property, a holiday home or land?",
            value: "No",
          },
        ],
      },
    ]);
  });

  it("shows partner properties only while a partner is present", () => {
    const answers = {
      partner: true,
      partner_additional_property_owned: "with_mortgage",
      partner_additional_properties: [
        {
          house_value: 140000,
          inline_owned_with_mortgage: false,
          mortgage: 70000,
          percentage_owned: 100,
        },
        {
          house_value: 90000,
          inline_owned_with_mortgage: true,
          mortgage: 30000,
          percentage_owned: 50,
        },
      ],
    } satisfies Partial<EligibilityData>;

    expect(propertySummaries(answers).map(({ heading }) => heading)).to.include(
      "Partner other property 2 details",
    );
    expect(
      propertySummaries({ ...answers, partner: false }).some(({ heading }) =>
        heading.startsWith("Partner other property"),
      ),
    ).to.equal(false);
  });

  it("shows client dispute annotations only when applicable", () => {
    const answers = {
      additional_property_owned: "outright",
      additional_properties: [
        {
          house_value: 50000,
          percentage_owned: 100,
          house_in_dispute: true,
        },
        {
          house_value: 70000,
          inline_owned_with_mortgage: false,
          percentage_owned: 50,
          house_in_dispute: false,
        },
      ],
    } satisfies Partial<EligibilityData>;

    expect(
      propertySummaries(answers)
        .filter(({ heading }) => heading.includes("details"))
        .map(({ rows }) => rows.map(({ key }) => key)),
    ).to.deep.equal([
      [
        "How much is the property, holiday home or land worth?",
        "What percentage does your client own?",
        "Disputed asset",
      ],
      [
        "How much is the property, holiday home or land worth?",
        "Is there an outstanding mortgage on the property, holiday home or land?",
        "What percentage does your client own?",
      ],
    ]);
    expect(
      propertySummaries({ ...answers, immigration_or_asylum: true })
        .filter(({ heading }) => heading.includes("details"))
        .flatMap(({ rows }) => rows.map(({ key }) => key)),
    ).not.to.include("Disputed asset");
  });
});