import { http, HttpResponse } from "msw";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";

import { UpdateApplicationDetailsRequestBody } from "#/api/clients/rcw/model/updateApplicationDetailsRequestBody.zod.gen.js";
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
  isClientDetailsTestApplicationId,
} from "../fixtures/rcw.fixtures.js";

const applicationFixtures = [
  incompleteApplication,
  completeApplication,
  clientDetailsApplication,
];

const applicationSnapshots = new Map<string, Application>();
const applicationVersions = new Map<string, number>();
const INITIAL_APPLICATION_VERSION = 23;
const APPLICATION_VERSION_INCREMENT = 1;

/**
 * Loads or creates the isolated snapshot for one browser-test application.
 * @param id - The requested application ID.
 * @returns The per-ID application snapshot.
 */
function getApplicationSnapshot(id: string): Application {
  const snapshot = applicationSnapshots.get(id);
  if (snapshot) {
    return snapshot;
  }

  let fixture: Application;
  if (isClientDetailsTestApplicationId(id)) {
    fixture = { ...clientDetailsApplication, id };
  } else {
    fixture =
      applicationFixtures.find((application) => application.id === id) ??
      incompleteApplication;
  }

  const application = structuredClone(fixture);
  applicationSnapshots.set(id, application);
  applicationVersions.set(id, INITIAL_APPLICATION_VERSION);
  return application;
}

export const rcwHandlers = [
  getGetApplicationsMockHandler(applications),
  getCreateApplicationMockHandler(createApplicationResponse),
  http.get("*/api/v1/applications/:id", ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json(getApplicationSnapshot(id), {
      headers: { ETag: `"${applicationVersions.get(id)}"` },
    });
  }),
  http.put("*/api/v1/applications/:id/details", async ({ params, request }) => {
    const id = String(params.id);
    const application = getApplicationSnapshot(id);
    const body = UpdateApplicationDetailsRequestBody.parse(
      await request.json(),
    );
    const { address, ...clientDetails } = body.clientDetails;
    applicationSnapshots.set(id, {
      ...application,
      clientDetails: {
        ...application.clientDetails,
        ...clientDetails,
        address:
          address === null
            ? null
            : {
                ...(application.clientDetails.address ?? {
                  createdAt: null,
                  id: null,
                  modifiedAt: null,
                }),
                ...address,
              },
      },
      ecfFlag: body.ecfFlag,
      reasonForReapplication: body.reasonForReapplication,
      scopingQuestions: body.scopingQuestions,
    });
    applicationVersions.set(
      id,
      (applicationVersions.get(id) ?? INITIAL_APPLICATION_VERSION) +
        APPLICATION_VERSION_INCREMENT,
    );
    return new HttpResponse(null, { status: HTTP_STATUS.NO_CONTENT });
  }),
  getUpdateApplicationStatusMockHandler(),
  getUpdateApplicationEvidenceMockHandler(),
  getUpdateApplicationDeclarationMockHandler(),
];
