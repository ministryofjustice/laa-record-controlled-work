import { http, HttpResponse } from "msw";

import { HTTP_STATUS } from "#/lib/constants/http.js";
import {
  getCreateApplicationMockHandler,
  getGetApplicationsMockHandler,
  getUpdateApplicationEvidenceMockHandler,
} from "#orval/mocks/rcw/msw/applications/applications.msw.gen.js";

import {
  applications,
  completeApplication,
  createApplicationResponse,
  incompleteApplication,
} from "../fixtures/rcw.js";

export const rcwHandlers = [
  getGetApplicationsMockHandler(applications),
  getCreateApplicationMockHandler(createApplicationResponse),
  http.get("*/api/v1/applications/:id", ({ params }) => {
    const application =
      params.id === completeApplication.id
        ? completeApplication
        : incompleteApplication;

    return HttpResponse.json(
      {
        ...application,
        ecfFlag: application.ecfFlag,
        scopingQuestions: application.scopingQuestions,
      },
      { headers: { etag: '"0"' }, status: HTTP_STATUS.OK },
    );
  }),
  getUpdateApplicationEvidenceMockHandler(),
];
