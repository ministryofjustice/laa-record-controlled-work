import {
  getCreateApplicationMockHandler,
  getGetApplicationMockHandler,
  getGetApplicationsMockHandler,
  getUpdateApplicationDeclarationMockHandler,
  getUpdateApplicationEvidenceMockHandler,
  getUpdateApplicationStatusMockHandler,
} from "#orval/mocks/rcw/msw/applications/applications.msw.gen.js";

import {
  applications,
  clientDetailsApplication,
  completeApplication,
  createApplicationResponse,
  incompleteApplication,
  meansAssessmentApplications,
} from "../fixtures/rcw.fixtures.js";

const applicationFixtures = [
  incompleteApplication,
  completeApplication,
  clientDetailsApplication,
  ...Object.values(meansAssessmentApplications),
];

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
  getUpdateApplicationDeclarationMockHandler(),
];
