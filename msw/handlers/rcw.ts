import {
  getCreateApplicationMockHandler,
  getGetApplicationMockHandler,
  getGetApplicationsMockHandler,
} from "#orval/mocks/rcw/msw/applications/applications.msw.gen.js";

import {
  application,
  applications,
  createApplicationResponse,
} from "../fixtures/rcw.js";

export const rcwHandlers = [
  getGetApplicationsMockHandler(applications),
  getCreateApplicationMockHandler(createApplicationResponse),
  getGetApplicationMockHandler(application),
];
