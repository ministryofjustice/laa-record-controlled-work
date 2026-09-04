import { expect } from "chai";
import sinon from "sinon";

import config from "#/config.js";
import { loadApplication } from "#/journeys/edit-application/effects/loadApplication.js";
import type {
  EditApplicationContext,
  EditApplicationEffectsDeps,
} from "#/journeys/edit-application/editApplication.types.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { logger } from "#/logger.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import {
  ApiResponseError,
  ApiValidationError,
} from "#/api/clients/api.errors.js";

describe("loadApplication", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";

  let context: EditApplicationContext;
  let getApplicationStub: sinon.SinonStub;
  let deps: EditApplicationEffectsDeps;
  let getSession: sinon.SinonStub;
  let getRequestParam: sinon.SinonStub;
  let setData: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    getApplicationStub = sinon.stub();
    deps = {
      getApplication: getApplicationStub,
      updateApplicationStatus: sinon.stub(),
    };
    setData = sinon.stub();
    getSession = sinon.stub().returns({
      id: "session-id",
      msal: { homeAccountId: "home-account-id" },
    });
    getRequestParam = sinon.stub().returns(applicationId);

    context = {
      getSession,
      getRequestParam,
      setData,
    } as unknown as EditApplicationContext;
  });

  afterEach(() => sinon.restore());

  it("sets application in context from getApplication response", async () => {
    const mockApplication = getGetApplicationResponseMock();

    getApplicationStub.resolves({ status: 200, data: mockApplication });

    await loadApplication(deps)(context);

    expect(getApplicationStub.calledOnceWith(applicationId)).to.equal(true);
    expect(
      setData.calledWith(CONTEXT_DATA_KEYS.application, mockApplication),
    ).to.equal(true);
  });

  it("throws ApiResponseError when getApplication responds with non-200", async () => {
    getApplicationStub.resolves({
      status: 500,
      data: {},
      headers: new Headers(),
    });
    sinon.stub(logger, "error");

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }
  });

  it("throws ApiResponseError when getApplication rejects", async () => {
    const cause = new Error("network error");
    getApplicationStub.rejects(cause);
    sinon.stub(logger, "error");

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      expect((error as ApiResponseError).cause).to.equal(cause);
    }
  });

  it("throws ApiResponseError when applicationID param is missing", async () => {
    getRequestParam.returns(undefined);
    sinon.stub(logger, "error");

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }
  });

  it("throws ApiValidationError when response data fails schema validation", async () => {
    getApplicationStub.resolves({
      status: 200,
      data: { invalid: true },
      headers: new Headers(),
    });
    sinon.stub(logger, "error");

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiValidationError);
    }
  });
});
