import { http, HttpResponse } from "msw";

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
  http.get("*/api/v1/applications/:id", ({ params }) =>
    HttpResponse.json(
      applicationFixtures.find((fixture) => fixture.id === params.id) ??
        incompleteApplication,
      { headers: { etag: '"1"' } },
    ),
  ),
  getUpdateApplicationStatusMockHandler(),
  getUpdateApplicationEvidenceMockHandler(),
  getUpdateApplicationDeclarationMockHandler(),
];
