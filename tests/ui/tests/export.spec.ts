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
