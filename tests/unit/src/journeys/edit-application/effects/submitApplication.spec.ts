import { expect } from "chai";
import sinon from "sinon";

import config from "#/config.js";
import type {
  EditApplicationContext,
  EditApplicationEffectsDeps,
} from "#/journeys/edit-application/editApplication.types.js";
import { logger } from "#/logger.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { ApiResponseError } from "#/api/clients/api.errors.js";
import { submitApplication } from "#/journeys/edit-application/effects/submitApplication.js";
import { ApplicationState } from "#/api/clients/rcw/model/applicationState.zod.gen.js";

describe("submitApplication", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";
  const mockApplication = getGetApplicationResponseMock({
    id: applicationId,
  });
  let context: EditApplicationContext;
  let updateApplicationStatusStub: sinon.SinonStub;
  let deps: EditApplicationEffectsDeps;
  let getSession: sinon.SinonStub;
  let getData: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    updateApplicationStatusStub = sinon.stub();
    deps = {
      getApplication: sinon.stub(),
      updateApplicationStatus: updateApplicationStatusStub,
    };
    getData = sinon.stub().returns(mockApplication);
    getSession = sinon.stub().returns({
      id: "session-id",
      msal: { homeAccountId: "home-account-id" },
    });

    context = {
      getSession,
      getData,
    } as unknown as EditApplicationContext;
  });

  afterEach(() => sinon.restore());

  it("updates application status application", async () => {
    // TODO: hard coded eTag will need to update tests when this is integrated
    const applicationState = {
      applicationState: ApplicationState.enum.COMPLETED,
      eTag: 1,
    };
    updateApplicationStatusStub.resolves({
      status: 204,
    });
    await submitApplication(deps)(context);

    expect(
      updateApplicationStatusStub.calledOnceWith(
        applicationId,
        applicationState,
        { headers: { Authorization: "Bearer test-access-token" } },
      ),
    ).to.equal(true);
  });

  it("throws ApiResponseError when getApplication responds with non-200", async () => {
    updateApplicationStatusStub.resolves({
      status: 500,
      data: {},
    });
    sinon.stub(logger, "error");

    try {
      await submitApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }
  });

  it("throws ApiResponseError when getApplication rejects", async () => {
    const cause = new Error("network error");
    updateApplicationStatusStub.rejects(cause);
    sinon.stub(logger, "error");

    try {
      await submitApplication(deps)(context);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      expect((error as ApiResponseError).cause).to.equal(cause);
    }
  });
});
