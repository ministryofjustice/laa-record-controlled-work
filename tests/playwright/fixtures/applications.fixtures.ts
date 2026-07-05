import { faker } from "@faker-js/faker";
import type { Applications } from "../../../src/api/client/model/applications.zod.gen.js";
import { getGetApplicationsResponseMock } from "../../mocks/api/fakers/applications/applications.faker.gen.js";

// keeps the faker data consistent across test runs, so that the same mock data is used for each test run and msw handlers
faker.seed(12345);


export const applications = [...getGetApplicationsResponseMock()].sort(
  (a, b) => b.modifiedAt.localeCompare(a.modifiedAt),
);
