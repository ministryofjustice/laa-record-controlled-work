import { http, HttpResponse } from "msw";

import { HTTP_STATUS } from "#/lib/constants/http.js";
import {
  getCreateApplicationMockHandler,
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
} from "../fixtures/rcw.fixtures.js";

const applicationFixtures = [
  incompleteApplication,
  completeApplication,
  clientDetailsApplication,
];

export const rcwHandlers = [
  getGetApplicationsMockHandler(applications),
  getCreateApplicationMockHandler(createApplicationResponse),
  http.get("*/api/v1/applications/:id", ({ params }) => {
    const application =
      applicationFixtures.find((f) => f.id === params.id) ??
      incompleteApplication;

    return HttpResponse.json(
      {
        ...application,
        ecfFlag: application.ecfFlag,
        scopingQuestions: application.scopingQuestions,
      },
      { headers: { etag: '"0"' }, status: HTTP_STATUS.OK },
    );
  }),
  getUpdateApplicationStatusMockHandler(),
  getUpdateApplicationEvidenceMockHandler(),
  getUpdateApplicationDeclarationMockHandler(),
];
