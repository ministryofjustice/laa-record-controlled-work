import { http, HttpResponse } from "msw";

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
  http.get("*/api/v1/applications/:id", ({ params }) =>
    HttpResponse.json(
      params.id === completeApplication.id
        ? completeApplication
        : incompleteApplication,
      { headers: { etag: '"1"' } },
    ),
  ),
  getUpdateApplicationEvidenceMockHandler(),
];
