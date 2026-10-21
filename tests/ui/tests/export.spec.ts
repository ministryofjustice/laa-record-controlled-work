import type { Page } from "@playwright/test";

import { MeansAssessmentScenarioName } from "#tests/fixtures/meansAssessment.fixtures.js";

import { expect, test } from "../fixtures/index.js";
import {
  completeApplication,
  meansAssessmentApplications,
} from "../msw/fixtures/rcw.fixtures.js";

const ELIGIBLE_OUTCOME =
  "Your client is financially eligible for controlled work and family mediation.";
const UNAVAILABLE_OUTCOME = "Financial eligibility outcome unavailable.";

interface RenderedScenarioExpectation {
  answerSummaries: boolean;
  outcome: null | string;
  scenario: MeansAssessmentScenarioName;
  section: boolean;
  totals: string[];
}

const RENDERED_SCENARIOS: RenderedScenarioExpectation[] = [
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.AsylumSupport,
    section: true,
    totals: [],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.Baseline,
    section: true,
    totals: [
      "Gross monthly income £0 Below upper limit (£2,657)",
      "Disposable monthly income £0 Eligible",
      "Disposable capital £0 No upper limit applies",
    ],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.CalculationStates,
    section: true,
    totals: [
      "Gross monthly income Not available",
      "Disposable capital £0 No upper limit applies",
    ],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.EmployedHousehold,
    section: true,
    totals: [
      "Gross monthly income £0 Below upper limit (£2,657)",
      "Disposable monthly income £0 Eligible",
      "Disposable capital £0 No upper limit applies",
    ],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.FormattingVariants,
    section: true,
    totals: [
      "Gross monthly income £0 Below upper limit (£2,657)",
      "Disposable monthly income £0 Eligible",
      "Disposable capital £0 No upper limit applies",
    ],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.HousingMortgage,
    section: true,
    totals: [
      "Gross monthly income £0 Below upper limit (£2,657)",
      "Disposable monthly income £0 Eligible",
      "Disposable capital £0 No upper limit applies",
    ],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.HousingSharedOwnership,
    section: true,
    totals: [
      "Gross monthly income £0 Below upper limit (£2,657)",
      "Disposable monthly income £0 Eligible",
      "Disposable capital £0 No upper limit applies",
    ],
  },
  {
    answerSummaries: false,
    outcome: UNAVAILABLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.MissingEligibility,
    section: true,
    totals: [],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.OtherIncomeAndOutgoings,
    section: true,
    totals: [
      "Gross monthly income £0 Below upper limit (£2,657)",
      "Disposable monthly income £0 Eligible",
      "Disposable capital £0 No upper limit applies",
    ],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.Passporting,
    section: true,
    totals: [],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.PropertiesAndAssets,
    section: true,
    totals: [
      "Gross monthly income £0 Below upper limit (£2,657)",
      "Disposable monthly income £0 Eligible",
      "Disposable capital £0 No upper limit applies",
    ],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.StaleInactiveAnswers,
    section: true,
    totals: [
      "Gross monthly income £0 Below upper limit (£2,657)",
      "Disposable monthly income £0 Eligible",
      "Disposable capital £0 No upper limit applies",
    ],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.Under18ControlledClr,
    section: true,
    totals: [],
  },
  {
    answerSummaries: true,
    outcome: ELIGIBLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.Under18NoMeans,
    section: true,
    totals: [],
  },
  {
    answerSummaries: true,
    outcome: UNAVAILABLE_OUTCOME,
    scenario: MeansAssessmentScenarioName.UnavailableResult,
    section: true,
    totals: [],
  },
  {
    answerSummaries: false,
    outcome: null,
    scenario: MeansAssessmentScenarioName.MeansAssessmentNotRequired,
    section: false,
    totals: [],
  },
];

async function trackCspViolations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.addEventListener("securitypolicyviolation", (event) => {
      const state = window as Window & { cspViolations?: string[] };
      state.cspViolations ??= [];
      state.cspViolations.push(event.violatedDirective);
    });
  });
}

async function renderedCardRows(
  page: Page,
  heading: string,
): Promise<Array<[string, string]>> {
  const summaryList = page
    .getByRole("heading", { exact: true, level: 4, name: heading })
    .locator("xpath=following-sibling::dl[1]");
  const keys = await summaryList
    .locator(".govuk-summary-list__key")
    .allTextContents();
  const values = await summaryList
    .locator(".govuk-summary-list__value")
    .allTextContents();

  return keys.map((key, index) => [key.trim(), values[index].trim()]);
}

test("export page renders the application header", async ({
  withSelectedOffice: page,
}) => {
  const response = await page.goto(`/cases/${completeApplication.id}/export`);

  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Record civil controlled work",
    }),
  ).toBeVisible();
  await expect(page.getByText("Client:")).toBeVisible();
  await expect(
    page.getByText(
      `Reference number: ${completeApplication.applicationRefNumber}`,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Legal Aid Agency logo" }),
  ).toBeVisible();
});

test("export page renders the client details section", async ({
  withSelectedOffice: page,
}) => {
  const response = await page.goto(`/cases/${completeApplication.id}/export`);
  const clientDetails = completeApplication.clientDetails;
  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole("heading", { level: 2, name: "Client and case details" }),
  ).toBeVisible();

  const rows = page.locator(".govuk-summary-list__row");

  for (const label of [
    "ECF",
    "Type of family law",
    "Transitional EU arrangements or an international maintenance agreement?",
    "Legal aid to protect themself or their children",
    "Evidence case is in scope",
    "Confirm merits",
    "Accessed legal aid before",
    "First name",
    "Last name",
    "Date of birth",
    "National Insurance number",
    "Address",
  ]) {
    await expect(rows.filter({ hasText: label })).toBeVisible();
  }

  await expect(rows.filter({ hasText: "ECF" })).toContainText("No");
  await expect(rows.filter({ hasText: "First name" })).toContainText(
    clientDetails.firstName,
  );
  await expect(rows.filter({ hasText: "Last name" })).toContainText(
    clientDetails.lastName,
  );
  await expect(rows.filter({ hasText: "Date of birth" })).toContainText(
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }).format(new Date(clientDetails.dateOfBirth)),
  );
  await expect(
    rows.filter({ hasText: "National Insurance number" }),
  ).toContainText(clientDetails.niNumber!);
  for (const addressLine of [
    clientDetails.address!.addressLine1,
    clientDetails.address!.addressLine2,
    clientDetails.address!.townOrCity,
    clientDetails.address!.county,
    clientDetails.address!.postCode,
  ]) {
    await expect(rows.filter({ hasText: "Address" })).toContainText(
      addressLine!,
    );
  }
});

test("export page renders mapped means outcomes, totals, and answer cards", async ({
  withSelectedOffice: page,
}) => {
  const response = await page.goto(`/cases/${completeApplication.id}/export`);

  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole("heading", { level: 2, name: "Means assessment" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Your client is financially eligible for controlled work and family mediation.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Your client's key eligibility totals",
    }),
  ).toBeVisible();
  await expect(page.locator(".app-means-assessment__total")).toHaveCount(3);
  await expect(
    page.locator(".app-means-assessment__total").nth(0),
  ).toContainText(
    ["Gross monthly income", "£2,450", "Below upper limit (£2,657)"].join(" "),
  );
  await expect(
    page.getByRole("heading", { level: 3, name: "Your answers" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Client details" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 4, name: "Client age" }),
  ).toBeVisible();
  await expect(
    page.locator(".app-means-assessment .govuk-summary-list__row").first(),
  ).toContainText("18 to 59");
});

for (const expected of RENDERED_SCENARIOS) {
  const title =
    expected.scenario === MeansAssessmentScenarioName.MeansAssessmentNotRequired
      ? "omits means assessment when explicitly not required"
      : `renders ${expected.scenario} means assessment`;

  test(title, async ({
    withSelectedOffice: page,
  }) => {
    const application = meansAssessmentApplications[expected.scenario];
    const response = await page.goto(`/cases/${application.id}/export`);
    const meansAssessment = page.locator(".app-means-assessment");

    expect(response?.ok()).toBe(true);
    await expect(meansAssessment).toHaveCount(expected.section ? 1 : 0);
    if (!expected.section) {
      return;
    }

    await expect(
      meansAssessment.getByRole("heading", {
        level: 2,
        name: "Means assessment",
      }),
    ).toBeVisible();
    if (expected.outcome !== null) {
      await expect(meansAssessment.getByText(expected.outcome)).toBeVisible();
    }

    const totals = meansAssessment.locator(".app-means-assessment__total");
    await expect(totals).toHaveCount(expected.totals.length);
    for (const [index, total] of expected.totals.entries()) {
      await expect(totals.nth(index)).toContainText(total);
    }

    const yourAnswersHeading = meansAssessment.getByRole("heading", {
      level: 3,
      name: "Your answers",
    });
    await expect(yourAnswersHeading).toHaveCount(
      expected.answerSummaries ? 1 : 0,
    );
  });
}

test("renders household answer values in their cards", async ({
  withSelectedOffice: page,
}) => {
  const application =
    meansAssessmentApplications[MeansAssessmentScenarioName.EmployedHousehold];
  await page.goto(`/cases/${application.id}/export`);

  const dependantIncome = page
    .getByRole("heading", { level: 4, name: "Dependant 1 income" })
    .locator("xpath=following-sibling::dl[1]");
  await expect(dependantIncome).toContainText("Monthly");
  await expect(dependantIncome).toContainText("£12.50");

  const employmentIncome = page
    .getByRole("heading", {
      level: 4,
      name: "Client employment income 1",
    })
    .locator("xpath=following-sibling::dl[1]");
  await expect(employmentIncome).toContainText("£2,450.00");
});

test("renders conditional income and outgoings rows in card order", async ({
  withSelectedOffice: page,
}) => {
  const application =
    meansAssessmentApplications[
      MeansAssessmentScenarioName.OtherIncomeAndOutgoings
    ];
  await page.goto(`/cases/${application.id}/export`);

  expect(await renderedCardRows(page, "Client other income")).toEqual([
    ["Does your client get financial help from friends or family?", "Yes"],
    ["Amount", "£40.00"],
    ["Frequency", "Monthly"],
    ["Does your client get maintenance from a former partner?", "Yes"],
    ["Amount", "£110.00"],
    ["Frequency", "Every week"],
    ["Does your client get income from a property or lodger?", "Yes"],
    ["Amount", "£250.00"],
    ["Frequency", "Monthly"],
    ["Does your client get income from pensions?", "Yes"],
    ["Amount", "£100.00"],
    ["Frequency", "Every 4 weeks"],
    ["Does your client get income from student finance?", "Yes"],
    ["Amount", "£90.00"],
    ["Does your client get income from other sources?", "Yes"],
    ["Amount", "£35.00"],
  ]);
  expect(
    await renderedCardRows(page, "Partner outgoings and deductions"),
  ).toEqual([
    ["Does the partner pay for childcare?", "Yes"],
    ["Amount", "£75.00"],
    ["Frequency", "Every 2 weeks"],
    ["Does the partner pay maintenance to a former partner?", "Yes"],
    ["Amount", "£30.00"],
    ["Frequency", "Every week"],
    [
      "Does the partner make payments toward legal aid for a criminal case?",
      "Yes",
    ],
    ["Amount", "£15.00"],
    ["Frequency", "Every month"],
  ]);
});

test("renders housing costs, properties, and disputed assets", async ({
  withSelectedOffice: page,
}) => {
  const housingApplication =
    meansAssessmentApplications[
      MeansAssessmentScenarioName.HousingSharedOwnership
    ];
  await page.goto(`/cases/${housingApplication.id}/export`);

  expect(await renderedCardRows(page, "Housing costs")).toEqual([
    ["Rent", "£480.00"],
    ["Frequency", "Every month"],
    ["Mortgage", "£320.00"],
    ["Frequency", "Every month"],
    ["Housing Benefit", "£90.00"],
    ["Frequency", "Monthly"],
  ]);

  const assetsApplication =
    meansAssessmentApplications[
      MeansAssessmentScenarioName.PropertiesAndAssets
    ];
  await page.goto(`/cases/${assetsApplication.id}/export`);

  expect(
    await renderedCardRows(page, "Client other property 2 details"),
  ).toEqual([
    ["How much is the property, holiday home or land worth?", "£80,000.00"],
    [
      "Is there an outstanding mortgage on the property, holiday home or land?",
      "Yes",
    ],
    ["Value of outstanding mortgage", "£25,000.00"],
    ["What percentage does your client own?", "25%"],
  ]);
  expect(await renderedCardRows(page, "Client assets")).toEqual([
    ["Does your client have any investments?", "Yes"],
    ["Investments", "£4,500.00"],
    ["Disputed asset", "Yes"],
    ["Does your client have valuable items worth £500 or more?", "Yes"],
    ["Valuable items", "£2,250.00"],
    ["Disputed asset", "Yes"],
  ]);
});

test("does not render stale answers behind inactive controls", async ({
  withSelectedOffice: page,
}) => {
  const application =
    meansAssessmentApplications[
      MeansAssessmentScenarioName.StaleInactiveAnswers
    ];
  await page.goto(`/cases/${application.id}/export`);

  for (const heading of [
    "Client employment income 1",
    "Client benefit 1 details",
    "Partner employment status",
    "Partner employment income 1",
    "Partner benefits",
    "Partner bank account 1",
    "Partner assets",
    "Client other property 1 details",
  ]) {
    await expect(
      page.getByRole("heading", { exact: true, level: 4, name: heading }),
    ).toHaveCount(0);
  }

  expect(await renderedCardRows(page, "Client other property")).toEqual([
    ["Does your client own any other property, a holiday home or land?", "No"],
  ]);
  expect(await renderedCardRows(page, "Client assets")).toEqual([
    ["Does your client have any investments?", "No"],
    ["Does your client have valuable items worth £500 or more?", "No"],
  ]);
});

test("export page loads assets without CSP violations", async ({
  withSelectedOffice: page,
}) => {
  await trackCspViolations(page);

  const response = await page.goto(`/cases/${completeApplication.id}/export`);

  expect(response?.ok()).toBe(true);
  expect(response?.headers()["content-security-policy"]).toContain(
    "default-src 'self'",
  );
  await page.evaluate(async () => document.fonts.ready);

  expect(
    await page.evaluate(() =>
      Array.from(document.styleSheets).some((stylesheet) => {
        try {
          return stylesheet.cssRules.length > 0;
        } catch {
          return false;
        }
      }),
    ),
  ).toBe(true);
  expect(
    await page
      .getByRole("img", { name: "Legal Aid Agency logo" })
      .evaluate(
        (image) =>
          (image as HTMLImageElement).complete &&
          (image as HTMLImageElement).naturalWidth > 0,
      ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document.fonts.status === "loaded" &&
        document.fonts.check("16px 'GDS Transport'"),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        (window as Window & { cspViolations?: string[] }).cspViolations ?? [],
    ),
  ).toEqual([]);
});
