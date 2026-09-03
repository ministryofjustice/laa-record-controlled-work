import type { Page } from "@playwright/test";

import { assertInProgressCaseVisible } from "#tests/e2e/assertions/case-list.assert.js";
import {
  assertEligibilityResultVisible,
  assertTaskStatus,
} from "#tests/e2e/assertions/task-list.assert.js";
import { signIn } from "#tests/e2e/flows/auth.flow.js";
import {
  gotoCase,
  gotoCaseList,
  openDraftCaseFromCaseList,
} from "#tests/e2e/flows/case-list.flow.js";
import {
  changeBankBalance,
  completeCcqShortestEligiblePath,
  returnToTaskList,
  submitCheckAnswers,
} from "#tests/e2e/flows/ccq.flow.js";
import {
  completeCreateCaseShortestPath,
  startNewCase,
} from "#tests/e2e/flows/create-case.flow.js";
import { completeDeclaration } from "#tests/e2e/flows/declaration.flow.js";
import {
  completeEvidenceNoPath,
  completeEvidenceYesPath,
} from "#tests/e2e/flows/evidence.flow.js";
import { selectOfficeByCode } from "#tests/e2e/flows/office.flow.js";
import {
  openMeansAssessmentFromTaskList,
  submitApplication,
  viewCompletedEligibilityAssessment,
} from "#tests/e2e/flows/task-list.flow.js";

export interface Actor {
  assertEligibilityResultVisible: () => Promise<void>;
  assertInProgressCaseVisible: (clientName: string) => Promise<void>;
  assertTaskStatus: (taskName: string, expectedStatus: string) => Promise<void>;
  changeBankBalance: (applicationId: string) => Promise<void>;
  completeCcqShortestEligiblePath: (applicationId: string) => Promise<void>;
  completeCreateCaseShortestPath: () => Promise<string>;
  completeDeclaration: (applicationId: string) => Promise<void>;
  completeEvidenceNoPath: (applicationId: string) => Promise<void>;
  completeEvidenceYesPath: (applicationId: string) => Promise<void>;
  gotoCase: (applicationId: string) => Promise<void>;
  gotoCaseList: () => Promise<void>;
  login: () => Promise<void>;
  openDraftCaseFromCaseList: (applicationId: string) => Promise<string>;
  openMeansAssessmentFromTaskList: (applicationId: string) => Promise<void>;
  returnToTaskList: (applicationId: string) => Promise<void>;
  selectOfficeByCode: (code: string) => Promise<void>;
  startNewCase: () => Promise<void>;
  submitApplication: (applicationId: string) => Promise<void>;
  submitCheckAnswers: (applicationId: string) => Promise<void>;
  viewCompletedEligibilityAssessment: (applicationId: string) => Promise<void>;
}

interface ActorFixtures {
  actor: Actor;
}

export const createActor = (page: Page): Actor => ({
  assertEligibilityResultVisible: async () => {
    await assertEligibilityResultVisible(page);
  },
  assertInProgressCaseVisible: async (clientName: string) => {
    await assertInProgressCaseVisible(page, clientName);
  },
  assertTaskStatus: async (taskName: string, expectedStatus: string) => {
    await assertTaskStatus(page, taskName, expectedStatus);
  },
  changeBankBalance: async (applicationId: string) => {
    await changeBankBalance(page, applicationId);
  },
  completeCcqShortestEligiblePath: async (applicationId: string) => {
    await completeCcqShortestEligiblePath(page, applicationId);
  },
  completeCreateCaseShortestPath: async () =>
    await completeCreateCaseShortestPath(page),
  completeDeclaration: async (applicationId: string) => {
    await completeDeclaration(page, applicationId);
  },
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
    await signIn(page);
  },
  openDraftCaseFromCaseList: async (applicationId: string) => {
    return await openDraftCaseFromCaseList(page, applicationId);
  },
  openMeansAssessmentFromTaskList: async (applicationId: string) => {
    await openMeansAssessmentFromTaskList(page, applicationId);
  },
  returnToTaskList: async (applicationId: string) => {
    await returnToTaskList(page, applicationId);
  },
  selectOfficeByCode: async (code: string) => {
    await selectOfficeByCode(page, code);
  },
  startNewCase: async () => {
    await startNewCase(page);
  },
  submitApplication: async (applicationId: string) => {
    await submitApplication(page, applicationId);
  },
  submitCheckAnswers: async (applicationId: string) => {
    await submitCheckAnswers(page, applicationId);
  },
  viewCompletedEligibilityAssessment: async (applicationId: string) => {
    await viewCompletedEligibilityAssessment(page, applicationId);
  },
});

export type { ActorFixtures };
