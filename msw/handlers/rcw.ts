import {
  getCreateApplicationMockHandler,
  getGetApplicationMockHandler,
  getGetApplicationsMockHandler,
  getUpdateApplicationEvidenceMockHandler,
} from "#orval/mocks/rcw/msw/applications/applications.msw.gen.js";

import {
  applications,
  createApplicationResponse,
  incompleteApplication,
} from "../fixtures/rcw.js";

export const rcwHandlers = [
  getGetApplicationsMockHandler(applications),
  getCreateApplicationMockHandler(createApplicationResponse),
  getGetApplicationMockHandler(incompleteApplication),
  getUpdateApplicationEvidenceMockHandler(),
];
