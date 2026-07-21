import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { describe, it } from "mocha";
import { loadYourCaseList } from "#/journeys/your-cases/effects/loadYourCaseList.js";
import sinon from "sinon";
import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import {
  CaseListContext,
  YourCasesEffectsDeps,
} from "#/journeys/your-cases/your-cases.types.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";
import { getGetApplicationsResponseMock } from "../../../../../mocks/api/rcw/fakers/applications/applications.faker.gen.js";

const { expect } = chai;
chai.use(chaiAsPromised);

function createCaseListContext() {
  const setData = sinon.spy();
  const context = { setData } as unknown as CaseListContext;
  return { context, setData };
}

describe("LoadYourCaseList", () => {
  let deps: YourCasesEffectsDeps;
  const mockData = getGetApplicationsResponseMock();
  let getApplicationsStub: sinon.SinonStub;

  beforeEach(() => {
    getApplicationsStub = sinon
      .stub()
      .resolves({ status: 200, data: mockData });
    deps = {
      getApplications: getApplicationsStub,
    };
  });

  afterEach(() => sinon.restore());

  describe("when getApplications succeeds", () => {
    it("sets caseList in context", async () => {
      const { context, setData } = createCaseListContext();

      await loadYourCaseList(deps)(context);
      expect(setData.calledOnceWithExactly("caseList", mockData)).to.equal(
        true,
      );
    });
  });

  describe("when getApplications throws", () => {
    // Stubbing logger.error prevents noisy test output.
    beforeEach(() => sinon.stub(logger, "error"));

    it("throws ApiResponseError when the API rejects", async () => {
      const cause = new Error("network error");
      getApplicationsStub.rejects(cause);

      const { context } = createCaseListContext();
      const promise = loadYourCaseList(deps)(context);

      await expect(promise).to.be.rejectedWith(ApiResponseError);
      const error = (await promise.catch(
        (err: unknown) => err,
      )) as ApiResponseError;
      expect(error.cause).to.equal(cause);
    });

    it("throws ApiResponseError when getApplications returns a non-200 status", async () => {
      getApplicationsStub.resolves({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: {},
      });

      const { context } = createCaseListContext();
      await expect(loadYourCaseList(deps)(context)).to.be.rejectedWith(
        ApiResponseError,
      );
    });

    it("throws ApiValidationError when getApplications returns invalid data", async () => {
      getApplicationsStub.resolves({
        status: HTTP_STATUS.OK,
        data: { invalid: true },
      });

      const { context } = createCaseListContext();
      await expect(loadYourCaseList(deps)(context)).to.be.rejectedWith(
        ApiValidationError,
        "failed schema validation",
      );
    });
  });
});
