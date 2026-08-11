import type { Page } from "@playwright/test";

import {
  ensureOfficeSelected,
  expect,
  signInWithMockOAuth,
  test,
} from "../../fixtures/index.js";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

const clickContinue = async (
  page: import("@playwright/test").Page,
): Promise<void> => {
  await page.getByRole("button", { name: "Continue" }).click();
};

const waitForPathChange = async (
  page: import("@playwright/test").Page,
  previousPath: string,
): Promise<void> => {
  await expect
    .poll(() => new URL(page.url()).pathname, {
      timeout: 30000,
      message: `Expected URL path to change from '${previousPath}'`,
    })
    .not.toBe(previousPath);
};

const completeCreateApplication = async (
  page: import("@playwright/test").Page,
): Promise<string> => {
  await page.goto("/cases/new/provider-declaration");
  await page.getByRole("button", { name: "Agree and continue" }).click();

  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("User");
  await page.getByLabel("Day").fill("01");
  await page.getByLabel("Month").fill("01");
  await page.getByLabel("Year").fill("1990");
  await clickContinue(page);

  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  await page.getByRole("radio", { name: "Yes" }).check();
  await clickContinue(page);

  await page.getByLabel("Address line 1").fill("1 Test Street");
  await page.getByLabel("Town or city").fill("Testtown");
  await page.getByLabel("Postcode").fill("SW1A 1AA");
  await clickContinue(page);

  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL(/\/cases\/[^/]+\/task-list\/?$/);

  const match = /\/cases\/([^/]+)\/task-list\/?$/.exec(
    new URL(page.url()).pathname,
  );

  if (match === null) {
    throw new Error("Failed to extract application ID from task-list URL");
  }

  return match[1];
};

const completeEligibilityJourney = async (
  page: import("@playwright/test").Page,
  applicationId: string,
): Promise<void> => {
  const eligibilityRoot = `/cases/${applicationId}/eligibility/`;

  await page.goto(eligibilityRoot);

  for (let index = 0; index < 20; index += 1) {
    const pathname = new URL(page.url()).pathname;

    if (pathname === `/cases/${applicationId}/task-list`) {
      return;
    }

    if (pathname === `/cases/${applicationId}/task-list/`) {
      return;
    }

    if (!pathname.startsWith(eligibilityRoot)) {
      throw new Error(`Unexpected path during eligibility journey: ${pathname}`);
    }

    const previousPath = pathname;
    const step = pathname.slice(eligibilityRoot.length).replace(/\/$/, "");

    switch (step) {
      case "": {
        await waitForPathChange(page, previousPath);
        break;
      }

      case "client-age-group": {
        await page.getByRole("radio", { name: "18 to 59" }).check();
        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      case "what-level-help": {
        await page
          .getByRole("radio", {
            name: "Civil controlled work or family mediation",
          })
          .check();
        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      case "is-this-immigration-asylum-matter": {
        await page.getByRole("radio", { name: "No" }).check();
        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      case "about-client": {
        await page
          .locator('input[name="applicant_form[partner]"][value="false"]')
          .check();

        await page
          .locator('input[name="applicant_form[passporting]"][value="true"]')
          .check();

        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      case "property-ownership": {
        await page
          .locator('input[name="property_form[property_owned]"][value="none"]')
          .check();

        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      case "does-client-own-other-property-holiday-home-land": {
        await page
          .locator(
            'input[name="additional_property_form[property_owned]"][value="none"]',
          )
          .check();

        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      case "client-assets": {
        await page.getByLabel("Total money in bank account").first().fill("0");

        await page
          .locator('input[name="client_assets_form[investments_relevant]"][value="false"]')
          .check();

        await page
          .locator('input[name="client_assets_form[valuables_relevant]"][value="false"]')
          .check();

        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      case "check-answers": {
        await page
          .getByRole("button", { name: "Submit eligibility check" })
          .click();
        break;
      }

      case "check-result": {
        await expect(
          page.getByText(
            "Your client qualifies for civil legal aid, for controlled work and family mediation",
          ),
        ).toBeVisible();

        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      default: {
        throw new Error(`Unhandled eligibility step '${step}' at path ${pathname}`);
      }
    }

    await waitForPathChange(page, previousPath);
  }

  throw new Error("Eligibility journey exceeded max step count");
};

test.describe("@e2e critical path", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let applicationId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      ignoreHTTPSErrors: true,
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("logs in", async () => {
    await signInWithMockOAuth(page);
    await expect(page).toHaveURL(/\/(select-office|cases)\/?/);
  });

  test("selects office", async () => {
    await ensureOfficeSelected(page);
    await expect(page).toHaveURL(/\/cases\/?$/);
  });

  test("creates new application", async () => {
    applicationId = await completeCreateApplication(page);
    await expect(page).toHaveURL(
      new RegExp(`/cases/${applicationId}/task-list/?$`),
    );
  });

  test("application appears in case list as in progress", async () => {
    await page.goto("/cases");
    await page.getByRole("tab", { name: "In progress" }).click();
    await expect(
      page.getByRole("cell", { name: "Test User" }),
    ).toBeVisible();
  });

  test("completes eligibility assessment", async () => {
    await completeEligibilityJourney(page, applicationId);
    await expect(page).toHaveURL(
      new RegExp(`/cases/${applicationId}/task-list/?$`),
    );
    const meansTask = page
      .locator(".govuk-task-list__item")
      .filter({ has: page.getByRole("link", { name: "Income and capital" }) });
    await expect(meansTask).toContainText("Completed");
  });

  test.fixme("completes evidence section", async () => {});
  test.fixme("completes declaration", async () => {});
  test.fixme("submits application", async () => {});
  test.fixme("checks recorded cases", async () => {});
  test.fixme("exports case", async () => {});
});
