import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const isRecordedCasePath = (
  pathname: string,
  applicationId: string,
): boolean => pathname === `/cases/${applicationId}/view/client-details`;

export const gotoRecordedCase = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  await page.goto(`/cases/${applicationId}/view/client-details`);
  await expect
    .poll(() => isRecordedCasePath(new URL(page.url()).pathname, applicationId))
    .toBe(true);
};

