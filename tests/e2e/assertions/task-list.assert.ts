import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const assertTaskStatus = async (
  page: Page,
  taskName: string,
  expectedStatus: string,
): Promise<void> => {
  const taskRow = page
    .locator(".govuk-task-list__item")
    .filter({ has: page.getByRole("link", { name: taskName }) });

  await expect(taskRow).toContainText(expectedStatus);
};
