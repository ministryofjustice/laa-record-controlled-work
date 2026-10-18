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
  http.get("*/api/v1/applications/:id", ({ params }) =>
    HttpResponse.json(
      String(params.id) === completeApplication.id
        ? completeApplication
        : incompleteApplication,
      { headers: { ETag: '"1"' } },
    ),
  ),
  http.put(
    "*/api/v1/applications/:id/details",
    () => new HttpResponse(null, { status: HTTP_STATUS.NO_CONTENT }),
  ),
  getUpdateApplicationEvidenceMockHandler(),
];
