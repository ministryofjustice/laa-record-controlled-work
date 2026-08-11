import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { createForgeTestClientForCaseList } from "../../../../integration/utils/helpers.js";
import {
  TestRenderResult,
  TestResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { ApiResponseError, ApiValidationError } from "#/api/clients/api.errors.js";
import { logger } from "#/logger.js";
import { getGetApplicationsResponseMock } from "#/api/mocks/rcw/fakers/applications/applications.faker.gen.js";

const mockData = getGetApplicationsResponseMock();
const session = {
  selectedOffice: {
    address: "1 High Street, Leeds, LS1 1AA",
    code: "LEEDS-01",
  },
};

describe("LoadYourCaseList", () => {
  describe("when getApplications succeeds", () => {
    let client: ReturnType<typeof createForgeTestClientForCaseList>;
    let getApplicationsStub: sinon.SinonStub;

    before(() => {
      getApplicationsStub = sinon
        .stub()
        .resolves({ status: 200, data: mockData });

      client = createForgeTestClientForCaseList({
        getApplications: getApplicationsStub,
      });
    });

    after(() => sinon.restore());

    it("calls getApplications", async () => {
      await client.get("/cases", { session });
      expect(getApplicationsStub.calledOnce).to.be.true;
    });

    it("sets caseList in context", async () => {
      const result = await client.get("/cases", { session });
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.data.caseList).to.deep.equal(mockData);
    });
  });

  describe("when getApplications throws", () => {
    // stubbing logger.error to avoid logging the error to the console during tests
    before(() => sinon.stub(logger, "error"));
    after(() => sinon.restore());

    async function getErrorFromYourCases(
      stub: sinon.SinonStub,
    ): Promise<TestResult> {
      const client = createForgeTestClientForCaseList({
        getApplications: stub,
      });
      return await client.get("/cases", { session });
    }

    it("throws ApiResponseError when the API rejects", async () => {
      const cause = new Error("network error");
      const stub = sinon.stub().rejects(cause);
      const result = await getErrorFromYourCases(stub);
      if (result.type === "error") {
        expect(result.error).to.be.instanceOf(ApiResponseError);
        const apiError = result.error as ApiResponseError;
        expect(apiError.cause).to.equal(cause);
      }
    });

    it("throws ApiResponseError when getApplications returns a non-200 status", async () => {
      const stub = sinon.stub().resolves({ status: 500, data: {} });
      const result = await getErrorFromYourCases(stub);
      if (result.type === "error") {
        expect(result.error).to.be.instanceOf(ApiResponseError);
      }
    });

    it("throws ApiValidationError when getApplications returns invalid data", async () => {
      const stub = sinon
        .stub()
        .resolves({ status: 200, data: { invalid: true } });

      const result = await getErrorFromYourCases(stub);
      if (result.type === "error") {
        const error = result.error;
        expect(error).to.be.instanceOf(ApiValidationError);
        const apiError = error as ApiValidationError;
        expect(apiError.message).to.include("failed schema validation");
      }
    });
  });
});
