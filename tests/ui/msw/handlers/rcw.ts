import {
  getCreateApplicationMockHandler,
  getGetApplicationMockHandler,
  getGetApplicationsMockHandler,
  getUpdateApplicationEvidenceMockHandler,
  getUpdateApplicationStatusMockHandler,
} from "#orval/mocks/rcw/msw/applications/applications.msw.gen.js";

import {
  applications,
  completeApplication,
  createApplicationResponse,
  incompleteApplication,
} from "../fixtures/rcw.fixtures.js";

const applicationFixtures = [incompleteApplication, completeApplication];

export const rcwHandlers = [
  getGetApplicationsMockHandler(applications),
  getCreateApplicationMockHandler(createApplicationResponse),
  getGetApplicationMockHandler(({ params }) => {
    return (
      applicationFixtures.find((f) => f.id === params.id) ??
      incompleteApplication
    );
  }),
  getUpdateApplicationStatusMockHandler(),
  getUpdateApplicationEvidenceMockHandler(),
];
