import { faker } from "@faker-js/faker";

import {
  getCreateApplicationResponseMock,
  getGetApplicationResponseMock,
  getGetApplicationsResponseMock,
} from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- deterministic test fixtures
faker.seed(12345);

export const applications = [...getGetApplicationsResponseMock()].sort((a, b) =>
  b.modifiedAt.localeCompare(a.modifiedAt),
);

export const createApplicationResponse = getCreateApplicationResponseMock();

export const application = getGetApplicationResponseMock({
  eligibility: { data: {} },
});
