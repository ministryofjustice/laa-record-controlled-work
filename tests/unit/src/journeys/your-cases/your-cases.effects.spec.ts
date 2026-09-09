import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { createForgeTestClient } from "../../../../integration/utils/helpers.js";
import {
  expectErrorOutcome,
  type ForgeTestClient,
  TestRenderResult,
  TestResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { yourCasesEffectsRegistry } from "#/journeys/your-cases/your-cases.effects.js";
import { yourCasesJourney } from "#/journeys/your-cases/your-cases.journey.js";
import { ApiResponseError, ApiValidationError } from "#/api/clients/api.errors.js";
import { logger } from "#/logger.js";
import { getGetApplicationsResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const mockData = getGetApplicationsResponseMock();
const session = {
  selectedOffice: {
    address: "1 High Street, Leeds, LS1 1AA",
    code: "LEEDS-01",
  },
};

describe("LoadYourCaseList", () => {
  describe("when getApplications succeeds", () => {
    let client: ForgeTestClient;
    let getApplicationsStub: sinon.SinonStub;

    before(() => {
      getApplicationsStub = sinon
        .stub()
        .resolves({ status: 200, data: mockData });

      client = createForgeTestClient(
        yourCasesJourney,
        yourCasesEffectsRegistry,
        { dependencies: { getApplications: getApplicationsStub } },
      );
    });

    beforeEach(() => getApplicationsStub.resetHistory());

    after(() => sinon.restore());

    it("calls getApplications", async () => {
      await client.get("/cases", { session });
      expect(getApplicationsStub.calledOnce).to.be.true;
    });

    it("loads draft applications for the selected office on the in-progress route", async () => {
      await client.get("/cases", { session });
      expect(
        getApplicationsStub.calledWith(
          sinon.match({ officeId: "LEEDS-01", status: "DRAFT" }),
        ),
      ).to.be.true;
    });

    it("loads completed applications for the selected office on the recorded route", async () => {
      await client.get("/cases/recorded", { session });
      expect(
        getApplicationsStub.calledWith(
          sinon.match({ officeId: "LEEDS-01", status: "COMPLETED" }),
        ),
      ).to.be.true;
    });

    it("loads completed applications for the selected office on the ineligible route", async () => {
      await client.get("/cases/ineligible", { session });
      expect(
        getApplicationsStub.calledWith(
          sinon.match({ officeId: "LEEDS-01", status: "COMPLETED" }),
        ),
      ).to.be.true;
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
      const client = createForgeTestClient(
        yourCasesJourney,
        yourCasesEffectsRegistry,
        { dependencies: { getApplications: stub } },
      );
      return await client.get("/cases", { session });
    }

    it("throws ApiResponseError when the API rejects", async () => {
      const cause = new Error("network error");
      const stub = sinon.stub().rejects(cause);
      const result = await getErrorFromYourCases(stub);
      expectErrorOutcome(result);

      const error = result.error.cause;
      expect(error).to.be.instanceOf(ApiResponseError);

      const apiError = error as ApiResponseError;
      expect(apiError.cause).to.equal(cause);
    });

    it("throws ApiResponseError when getApplications returns a non-200 status", async () => {
      const stub = sinon.stub().resolves({ status: 500, data: {} });
      const result = await getErrorFromYourCases(stub);
      expectErrorOutcome(result);

      const error = result.error.cause;
      expect(error).to.be.instanceOf(ApiResponseError);
    });

    it("throws ApiValidationError when getApplications returns invalid data", async () => {
      const stub = sinon
        .stub()
        .resolves({ status: 200, data: { invalid: true } });

      const result = await getErrorFromYourCases(stub);
      expectErrorOutcome(result);

      const error = result.error.cause;
      expect(error).to.be.instanceOf(ApiValidationError);

      const apiError = error as ApiValidationError;
      expect(apiError.message).to.include("failed schema validation");
    });
  });
});
