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
  let getRequestHeader: sinon.SinonStub;
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
    getRequestHeader = sinon.stub().returns("test-correlation-id"),

    context = {
      getSession,
      getRequestParam,
      getRequestHeader,
      setData,
    } as unknown as EditApplicationContext;
  });

  afterEach(() => sinon.restore());

  it("sets application in context from getApplication response", async () => {
    const mockApplication = getGetApplicationResponseMock({
      ecfFlag: null,
      scopingQuestions: null,
    });

    getApplicationStub.resolves({
      status: 200,
      data: mockApplication,
      headers: new Headers({ etag: '"000"' }),
    });

    await loadApplication(deps)(context);

    expect(getApplicationStub.calledOnceWith(applicationId)).to.equal(true);
    expect(
      setData.calledWith(CONTEXT_DATA_KEYS.application, mockApplication),
    ).to.equal(true);
    expect(
      setData.calledWith(CONTEXT_DATA_KEYS.applicationETag, '"000"'),
    ).to.equal(true);
  });

  it("rejects a malformed ETag without writing application data", async () => {
    getApplicationStub.resolves({
      status: 200,
      data: getGetApplicationResponseMock({
        ecfFlag: null,
        scopingQuestions: null,
      }),
      headers: new Headers({ etag: 'W/"1"' }),
    });
    const loggerError = sinon.stub(logger, "error");

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      expect((error as ApiResponseError).cause).to.equal(undefined);
    }

    expect(setData.notCalled).to.equal(true);
    expect(loggerError.firstCall.args[2]).to.deep.equal({
      api: "getApplication",
      errorCategory: "invalid_etag",
    });
    expect(JSON.stringify(loggerError.firstCall.args)).to.not.include('W/"1"');
  });

  it("rejects a missing ETag without writing application data", async () => {
    getApplicationStub.resolves({
      status: 200,
      data: getGetApplicationResponseMock({
        ecfFlag: null,
        scopingQuestions: null,
      }),
      headers: new Headers(),
    });
    sinon.stub(logger, "error");

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }

    expect(setData.notCalled).to.equal(true);
  });

  it("throws ApiResponseError when getApplication responds with non-200", async () => {
    const loggerError = sinon.stub(logger, "error");
    getApplicationStub.resolves({
      status: 500,
      data: { detail: "synthetic response body" },
      headers: new Headers({ authorization: "synthetic token" }),
    });

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      expect((error as ApiResponseError).cause).to.equal(undefined);
    }

    expect(loggerError.firstCall.args[2]).to.deep.equal({
      api: "getApplication",
      errorCategory: "http_response",
      status: 500,
    });
    expect(JSON.stringify(loggerError.firstCall.args)).to.not.include(
      "synthetic response body",
    );
    expect(JSON.stringify(loggerError.firstCall.args)).to.not.include(
      "synthetic token",
    );
  });

  it("throws ApiResponseError when getApplication rejects", async () => {
    const cause = new Error("network error");
    getApplicationStub.rejects(cause);
    const loggerError = sinon.stub(logger, "error");

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      expect((error as ApiResponseError).cause).to.equal(undefined);
      expect((error as ApiResponseError).toJSON().cause).to.equal(undefined);
    }

    expect(loggerError.firstCall.args[2]).to.deep.equal({
      api: "getApplication",
      errorCategory: "fetch",
    });
    expect(JSON.stringify(loggerError.firstCall.args)).to.not.include(
      "network error",
    );
  });

  it("throws ApiResponseError when applicationID param is missing", async () => {
    getRequestParam.returns(undefined);
    const loggerError = sinon.stub(logger, "error");

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }

    expect(loggerError.calledOnce).to.equal(true);
    expect(loggerError.firstCall.args[2]).to.deep.equal({
      api: "getApplication",
      errorCategory: "missing_parameter",
    });
  });

  it("throws ApiValidationError when response data fails schema validation", async () => {
    const loggerError = sinon.stub(logger, "error");
    getApplicationStub.resolves({
      status: 200,
      data: { invalid: "synthetic response body" },
      headers: new Headers(),
    });

    try {
      await loadApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiValidationError);
      expect((error as ApiValidationError).cause).to.equal(undefined);
    }

    expect(loggerError.firstCall.args[2]).to.deep.include({
      api: "getApplication",
      errorCategory: "schema_validation",
    });
    const metadata = loggerError.firstCall.args[2] as {
      issues: Array<Record<string, unknown>>;
    };
    expect(metadata.issues).to.be.an("array").that.is.not.empty;
    for (const issue of metadata.issues) {
      expect(Object.keys(issue).sort()).to.deep.equal(["code", "path"]);
    }
    expect(JSON.stringify(loggerError.firstCall.args)).to.not.include(
      "synthetic response body",
    );
  });
});
