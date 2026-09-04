import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const assertRecordedCaseVisible = async (
  page: Page,
  clientName: string,
): Promise<void> => {
  await expect(page.getByRole("heading", { name: clientName })).toBeVisible();

  await expect(
    page.getByRole("navigation").filter({
      has: page.getByRole("link", { name: "Client and case details" }),
    }),
  ).toBeVisible();
};
