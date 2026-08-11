import type { Page } from "@playwright/test";

import { assertTaskStatus } from "../assertions/task-list.assert.js";
import { signInWithMockOAuth } from "../flows/auth.flow.js";
import {
  assertInProgressCaseVisible,
  gotoCase,
  gotoCaseList,
} from "../flows/case-list.flow.js";
import { completeCcqShortestEligiblePath } from "../flows/ccq.flow.js";
import {
  completeCreateCaseShortestPath,
  startNewCase,
} from "../flows/create-case.flow.js";
import {
  completeEvidenceNoPath,
  completeEvidenceYesPath,
} from "../flows/evidence.flow.js";
import { ensureOfficeSelected } from "../flows/office.flow.js";

export interface E2EActor {
  assertInProgressCaseVisible: (clientName: string) => Promise<void>;
  assertTaskStatus: (taskName: string, expectedStatus: string) => Promise<void>;
  completeCcqShortestEligiblePath: (applicationId: string) => Promise<void>;
  completeCreateCaseShortestPath: () => Promise<string>;
  completeEvidenceNoPath: (applicationId: string) => Promise<void>;
  completeEvidenceYesPath: (applicationId: string) => Promise<void>;
  ensureOfficeSelected: () => Promise<void>;
  gotoCase: (applicationId: string) => Promise<void>;
  gotoCaseList: () => Promise<void>;
  login: () => Promise<void>;
  startNewCase: () => Promise<void>;
}

interface ActorFixtures {
  actor: E2EActor;
}

export const createActor = (page: Page): E2EActor => ({
  assertInProgressCaseVisible: async (clientName: string) => {
    await assertInProgressCaseVisible(page, clientName);
  },
  assertTaskStatus: async (taskName: string, expectedStatus: string) => {
    await assertTaskStatus(page, taskName, expectedStatus);
  },
  completeCcqShortestEligiblePath: async (applicationId: string) => {
    await completeCcqShortestEligiblePath(page, applicationId);
  },
  completeCreateCaseShortestPath: async () =>
    await completeCreateCaseShortestPath(page),
  completeEvidenceNoPath: async (applicationId: string) => {
    await completeEvidenceNoPath(page, applicationId);
  },
  completeEvidenceYesPath: async (applicationId: string) => {
    await completeEvidenceYesPath(page, applicationId);
  },
  ensureOfficeSelected: async () => {
    await ensureOfficeSelected(page);
  },
  gotoCase: async (applicationId: string) => {
    await gotoCase(page, applicationId);
  },
  gotoCaseList: async () => {
    await gotoCaseList(page);
  },
  login: async () => {
    await signInWithMockOAuth(page);
  },
  startNewCase: async () => {
    await startNewCase(page);
  },
});

export type { ActorFixtures };
