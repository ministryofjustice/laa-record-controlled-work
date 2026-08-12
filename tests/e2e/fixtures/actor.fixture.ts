import type { Page } from "@playwright/test";

import { assertTaskStatus } from "../assertions/task-list.assert.js";
import { signInWithMockOAuth } from "../flows/auth.flow.js";
import {
  assertInProgressCaseVisible,
  gotoCase,
  gotoCaseList,
  openDraftCaseFromCaseList,
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
import { selectOfficeByCode } from "../flows/office.flow.js";
import { openMeansAssessmentFromTaskList } from "../flows/task-list.flow.js";

export interface E2EActor {
  assertInProgressCaseVisible: (clientName: string) => Promise<void>;
  assertTaskStatus: (taskName: string, expectedStatus: string) => Promise<void>;
  completeCcqShortestEligiblePath: (applicationId: string) => Promise<void>;
  completeCreateCaseShortestPath: () => Promise<string>;
  completeEvidenceNoPath: (applicationId: string) => Promise<void>;
  completeEvidenceYesPath: (applicationId: string) => Promise<void>;
  gotoCase: (applicationId: string) => Promise<void>;
  gotoCaseList: () => Promise<void>;
  login: () => Promise<void>;
  openDraftCaseFromCaseList: (applicationId: string) => Promise<string>;
  openMeansAssessmentFromTaskList: (applicationId: string) => Promise<void>;
  selectOfficeByCode: (code: string) => Promise<void>;
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
  gotoCase: async (applicationId: string) => {
    await gotoCase(page, applicationId);
  },
  gotoCaseList: async () => {
    await gotoCaseList(page);
  },
  login: async () => {
    await signInWithMockOAuth(page);
  },
  openDraftCaseFromCaseList: async (applicationId: string) => {
    return await openDraftCaseFromCaseList(page, applicationId);
  },
  openMeansAssessmentFromTaskList: async (applicationId: string) => {
    await openMeansAssessmentFromTaskList(page, applicationId);
  },
  selectOfficeByCode: async (code: string) => {
    await selectOfficeByCode(page, code);
  },
  startNewCase: async () => {
    await startNewCase(page);
  },
});

export type { ActorFixtures };
