import type {
  MeansAssessmentAnswerSummary,
  MeansAssessmentAnswerSummaryCard,
} from "#/export/sections/meansAssessment/answers/answers.types.js";

/**
 * Flattens section cards for card-owned behavior assertions.
 * @param sections Mapped answer sections, when available.
 * @returns Cards in saved section and card order.
 */
export function answerCards(
  sections: MeansAssessmentAnswerSummary[] | undefined,
): MeansAssessmentAnswerSummaryCard[] {
  return sections?.flatMap(({ cards }) => cards) ?? [];
}

export const expectedAnswerSummaries: MeansAssessmentAnswerSummary[] = [
  {
    cards: [
      {
        heading: "Client age",
        rows: [{ key: "What age is your client?", value: "18 to 59" }],
      },
      {
        heading: "Partner and passporting",
        rows: [
          { key: "Does your client have a partner?", value: "No" },
          {
            key: "Does your client receive a passporting benefit?",
            value: "No",
          },
        ],
      },
    ],
    heading: "Client details",
  },
  {
    cards: [
      {
        heading: "Number of dependants",
        rows: [
          { key: "Does your client have any child dependants?", value: "No" },
          { key: "Does your client have any adult dependants?", value: "No" },
        ],
      },
    ],
    heading: "Dependants",
  },
  {
    cards: [
      {
        heading: "Employment status",
        rows: [
          {
            key: "What is your client's employment status?",
            value: "Unemployed",
          },
        ],
      },
      {
        heading: "Client benefits",
        rows: [
          {
            key: "Does your client get any non-passporting benefits?",
            value: "No",
          },
        ],
      },
      {
        heading: "Client other income",
        rows: [
          {
            key: "Does your client get financial help from friends or family?",
            value: "No",
          },
          {
            key: "Does your client get maintenance from a former partner?",
            value: "No",
          },
          {
            key: "Does your client get income from a property or lodger?",
            value: "No",
          },
          { key: "Does your client get income from pensions?", value: "No" },
          {
            key: "Does your client get income from student finance?",
            value: "No",
          },
          {
            key: "Does your client get income from other sources?",
            value: "No",
          },
        ],
      },
    ],
    heading: "Client income",
  },
  {
    cards: [
      {
        heading: "Client outgoings and deductions",
        rows: [
          {
            key: "Does your client pay maintenance to a former partner?",
            value: "No",
          },
          {
            key: "Does your client make payments toward legal aid for a criminal case?",
            value: "No",
          },
        ],
      },
    ],
    heading: "Outgoings",
  },
  {
    cards: [
      {
        heading: "Home client usually lives in",
        rows: [
          {
            key: "Does your client own the home the client usually lives in?",
            value: "No",
          },
        ],
      },
      {
        heading: "Housing costs",
        rows: [
          { key: "Housing payments", value: "£0.00" },
          {
            key: "Is Housing Benefit claimed at the home the client lives in?",
            value: "No",
          },
        ],
      },
      {
        heading: "Client other property",
        rows: [
          {
            key: "Does your client own any other property, a holiday home or land?",
            value: "No",
          },
        ],
      },
    ],
    heading: "Housing and property",
  },
  {
    cards: [
      {
        heading: "Client assets",
        rows: [
          { key: "Does your client have any investments?", value: "No" },
          {
            key: "Does your client have valuable items worth £500 or more?",
            value: "No",
          },
        ],
      },
    ],
    heading: "Assets",
  },
];
