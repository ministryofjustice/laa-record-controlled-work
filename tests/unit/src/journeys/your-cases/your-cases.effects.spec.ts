import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { createForgeTestClientForCaseList } from "../../../../integration/utils/helpers.js";
import { TestRenderResult } from "@ministryofjustice/hmpps-forge/core/testing";
import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { logger } from "#/logger.js";
import { getGetApplicationsResponseMock } from "../../../../mocks/api/rcw/fakers/applications/applications.faker.gen.js";

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
    ): Promise<unknown> {
      const client = createForgeTestClientForCaseList({
        getApplications: stub,
      });
      try {
        await client.get("/cases", { session });
      } catch (err) {
        return err;
      }
    }

    it("throws ApiResponseError when the API rejects", async () => {
      const cause = new Error("network error");
      const error = await getErrorFromYourCases(sinon.stub().rejects(cause));
      expect(error).to.be.instanceOf(ApiResponseError);
      const apiError = error as ApiResponseError;
      expect(apiError.cause).to.equal(cause);
    });

    it("throws ApiResponseError when getApplications returns a non-200 status", async () => {
      const error = await getErrorFromYourCases(
        sinon.stub().resolves({ status: 500, data: {} }),
      );
      expect(error).to.be.instanceOf(ApiResponseError);
    });

    it("throws ApiValidationError when getApplications returns invalid data", async () => {
      const error = await getErrorFromYourCases(
        sinon.stub().resolves({ status: 200, data: { invalid: true } }),
      );
      expect(error).to.be.instanceOf(ApiValidationError);
      const apiError = error as ApiValidationError;
      expect(apiError.message).to.include("failed schema validation");
    });
  });
});
