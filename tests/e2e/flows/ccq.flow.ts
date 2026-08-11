import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

const FLOW_TIMEOUT_MS = 30000;
const MAX_STEPS = 20;
const STEP_INCREMENT = 1;

const waitForPathChange = async (
  page: Page,
  previousPath: string,
): Promise<void> => {
  await expect
    .poll(() => new URL(page.url()).pathname, {
      message: `Expected URL path to change from '${previousPath}'`,
      timeout: FLOW_TIMEOUT_MS,
    })
    .not.toBe(previousPath);
};

export const completeCcqShortestEligiblePath = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  const eligibilityRoot = `/cases/${applicationId}/eligibility/`;

  await page.goto(eligibilityRoot);

  // This journey is intentionally stepwise and depends on each page transition.
  /* eslint-disable no-await-in-loop -- Each step depends on prior page navigation completion. */
  for (let index = 0; index < MAX_STEPS; index += STEP_INCREMENT) {
    const { pathname } = new URL(page.url());

    if (pathname === `/cases/${applicationId}/task-list`) {
      return;
    }

    if (pathname === `/cases/${applicationId}/task-list/`) {
      return;
    }

    if (!pathname.startsWith(eligibilityRoot)) {
      throw new Error(
        `Unexpected path during eligibility journey: ${pathname}`,
      );
    }

    const previousPath = pathname;
    const step = pathname.slice(eligibilityRoot.length).replace(/\/$/, "");

    switch (step) {
      case "": {
        await waitForPathChange(page, previousPath);
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

      case "client-age-group": {
        await page.getByRole("radio", { name: "18 to 59" }).check();
        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      case "client-assets": {
        await page.getByLabel("Total money in bank account").first().fill("0");

        await page
          .locator(
            'input[name="client_assets_form[investments_relevant]"][value="false"]',
          )
          .check();

        await page
          .locator(
            'input[name="client_assets_form[valuables_relevant]"][value="false"]',
          )
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

      case "is-this-immigration-asylum-matter": {
        await page.getByRole("radio", { name: "No" }).check();
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

      case "what-level-help": {
        await page
          .getByRole("radio", {
            name: "Civil controlled work or family mediation",
          })
          .check();
        await page.getByRole("button", { name: "Save and continue" }).click();
        break;
      }

      default: {
        throw new Error(
          `Unhandled eligibility step '${step}' at path ${pathname}`,
        );
      }
    }

    await waitForPathChange(page, previousPath);
  }
  /* eslint-enable no-await-in-loop */

  throw new Error("Eligibility journey exceeded max step count");
};
