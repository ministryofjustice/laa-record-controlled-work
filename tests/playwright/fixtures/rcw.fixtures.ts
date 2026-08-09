import { faker } from "@faker-js/faker";
import { getCreateApplicationResponseMock, getGetApplicationsResponseMock, getGetApplicationResponseMock } from "../../mocks/api/rcw/fakers/applications/applications.faker.gen.js";

// keeps the faker data consistent across test runs, so that the same mock data is used for each test run and msw handlers
faker.seed(12345);

export const applications = [...getGetApplicationsResponseMock()].sort(
  (a, b) => b.modifiedAt.localeCompare(a.modifiedAt),
);

export const createApplicationResponse = getCreateApplicationResponseMock();

export const application = getGetApplicationResponseMock();
