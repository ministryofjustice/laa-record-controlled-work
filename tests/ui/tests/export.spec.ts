import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures/index.js";
import { completeApplication } from "../msw/fixtures/rcw.fixtures.js";

async function trackCspViolations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.addEventListener("securitypolicyviolation", (event) => {
      const state = window as Window & { cspViolations?: string[] };
      state.cspViolations ??= [];
      state.cspViolations.push(event.violatedDirective);
    });
  });
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
    page.getByText(`Reference number: ${completeApplication.applicationRefNumber}`),
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
  await expect(rows.filter({ hasText: "National Insurance number" })).toContainText(
    clientDetails.niNumber!,
  );
  for (const addressLine of [
    clientDetails.address!.addressLine1,
    clientDetails.address!.addressLine2,
    clientDetails.address!.townOrCity,
    clientDetails.address!.county,
    clientDetails.address!.postCode,
  ]) {
    await expect(rows.filter({ hasText: "Address" })).toContainText(addressLine!);
  }
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
    await page.getByRole("img", { name: "Legal Aid Agency logo" }).evaluate(
      (image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
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
      () => (window as Window & { cspViolations?: string[] }).cspViolations ?? [],
    ),
  ).toEqual([]);
});
