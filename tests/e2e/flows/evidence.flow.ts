import type { Page } from "@playwright/test";

export const completeEvidenceYesPath = async (
  _page: Page,
  _applicationId: string,
): Promise<void> => {
  await Promise.reject(
    new Error("completeEvidenceYesPath is not implemented in Phase 2"),
  );
};

export const completeEvidenceNoPath = async (
  _page: Page,
  _applicationId: string,
): Promise<void> => {
  await Promise.reject(
    new Error("completeEvidenceNoPath is not implemented in Phase 2"),
  );
};
