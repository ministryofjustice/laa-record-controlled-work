import * as Sentry from "@sentry/node";
import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import { ApiResponseError } from "#/api/clients/api.errors.js";
import config from "#/config.js";
import { updateClientDetails } from "#/journeys/edit-client-details/effects/updateClientDetails.js";
import type {
  EditApplicationContext,
  EditApplicationEffectsDeps,
} from "#/journeys/edit-application/editApplication.types.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";
import { logger } from "#/logger.js";

describe("updateClientDetails", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";
  const journeyCode = JourneyCode.EDIT_CLIENT_DETAILS;
  const draftKey = `${journeyCode}:${applicationId}`;
  const answers = {
    careProceedingsStarted: "no",
    dateOfBirth: "1990-01-01",
    ecf: "no",
    familyLawClassification: "public",
    firstName: "Jane",
    hasNINumber: "no",
    haveAHomeAddress: "no",
    lastName: "Bloggs",
    legalAidBefore: "no",
  };
  const expectedRequest = {
    clientDetails: {
      firstName: "Jane",
      lastName: "Bloggs",
      dateOfBirth: "1990-01-01",
      niNumber: null,
      hasFixedAddress: false,
      address: null,
    },
    legalAidLast6Months: false,
    reasonForReapplication: null,
    scopingQuestions: {
      priorLegalAid: "no",
      familyLawClassification: "public",
      careProceedingsStarted: false,
      caseMeetsMeritsCriteria: true,
    },
    ecfFlag: false,
  };

  let context: EditApplicationContext;
  let deps: EditApplicationEffectsDeps;
  let session: {
    id?: string;
    journeyDrafts: Record<string, Record<string, unknown>>;
    journeyDraftVersions: Record<string, string | undefined>;
  };
  let updateApplicationDetailsStub: sinon.SinonStub;
  let mockAccessTokenStub: sinon.SinonStub;

  beforeEach(() => {
    mockAccessTokenStub = sinon
      .stub(config.api, "useMockAccessToken")
      .value(true);
    sinon.stub(logger, "error");
    updateApplicationDetailsStub = sinon.stub();
    deps = {
      updateApplicationDetails: updateApplicationDetailsStub,
    } as unknown as EditApplicationEffectsDeps;
    session = {
      id: "session-id",
      journeyDrafts: { [draftKey]: { ...answers } },
      journeyDraftVersions: { [draftKey]: '"00023"' },
    };
    context = {
      getData: sinon.stub().returns({ providerOfficeCode: "test-office" }),
      getRequestHeader: sinon.stub().returns("test-correlation-id"),
      getRequestParam: sinon.stub().returns(applicationId),
      getSession: sinon.stub().returns(session),
    } as unknown as EditApplicationContext;
  });

  afterEach(() => sinon.restore());

  it("sends the complete snapshot with the original version and auth headers", async () => {
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    updateApplicationDetailsStub.resolves({
      status: 204,
      data: undefined,
      headers: new Headers(),
    });

    await updateClientDetails(deps)(context, journeyCode);

    expect(updateApplicationDetailsStub.calledOnce).to.equal(true);
    expect(updateApplicationDetailsStub.firstCall.args[0]).to.equal(
      applicationId,
    );
    expect(updateApplicationDetailsStub.firstCall.args[1]).to.deep.equal(
      expectedRequest,
    );
    const options = updateApplicationDetailsStub.firstCall
      .args[2] as RequestInit;
    expect(options.headers).to.be.instanceOf(Headers);
    const headers = new Headers(options.headers);
    expect(headers.get("authorization")).to.equal("Bearer test-access-token");
    expect(headers.get("x-correlation-id")).to.equal("test-correlation-id");
    expect(headers.get("if-match")).to.equal('"00023"');
    expectUpdateMetric(distributionStub, "success", 204);
    expect(session.journeyDrafts[draftKey]).to.deep.equal(answers);
    expect(session.journeyDraftVersions[draftKey]).to.equal('"00023"');
  });

  it("preserves versions above the JavaScript safe-integer range", async () => {
    session.journeyDraftVersions[draftKey] = '"9007199254740992"';
    updateApplicationDetailsStub.resolves({
      status: 204,
      data: undefined,
      headers: new Headers(),
    });

    await updateClientDetails(deps)(context, journeyCode);

    const options = updateApplicationDetailsStub.firstCall
      .args[2] as RequestInit;
    expect(new Headers(options.headers).get("if-match")).to.equal(
      '"9007199254740992"',
    );
  });

  it("does not submit without a valid session", async () => {
    (context.getSession as sinon.SinonStub).returns(undefined);

    await expectApiFailure();

    expect(updateApplicationDetailsStub.called).to.equal(false);
  });

  it("does not submit when authentication fails", async () => {
    mockAccessTokenStub.value(false);
    session.id = undefined;

    await expectApiFailure();

    expect(updateApplicationDetailsStub.called).to.equal(false);
  });

  it("does not submit when the draft is missing", async () => {
    delete session.journeyDrafts[draftKey];
    await expectApiFailure();
    expect(updateApplicationDetailsStub.called).to.equal(false);
  });

  it("does not submit when the application id is missing", async () => {
    (context.getRequestParam as sinon.SinonStub).returns(undefined);
    await expectApiFailure();
    expect(updateApplicationDetailsStub.called).to.equal(false);
  });

  it("does not submit missing or malformed original versions", async () => {
    for (const version of [undefined, "23", 'W/"23"', "*"]) {
      session.journeyDraftVersions[draftKey] = version;
      await expectApiFailure();
      expect(updateApplicationDetailsStub.called).to.equal(false);
    }
  });

  it("does not submit incomplete answers", async () => {
    session.journeyDrafts[draftKey] = { firstName: "Jane" };
    await expectApiFailure();
    expect(updateApplicationDetailsStub.called).to.equal(false);
  });

  it("does not submit a request rejected by the generated schema", async () => {
    session.journeyDrafts[draftKey] = {
      ...answers,
      hasNINumber: "yes",
      niNumber: "invalid",
    };
    await expectApiFailure();
    expect(updateApplicationDetailsStub.called).to.equal(false);
  });

  for (const status of [
    200, 400, 401, 403, 404, 409, 412, 413, 428, 500, 502, 503,
  ]) {
    it(`retains the draft when the API returns ${status}`, async () => {
      const distributionStub = sinon.stub(Sentry.metrics, "distribution");
      updateApplicationDetailsStub.resolves({
        status,
        data: {},
        headers: new Headers(),
      });

      await expectApiFailure();

      expectDraftRetained();
      expectUpdateMetric(distributionStub, "error", status);
    });
  }

  it("retains the draft when the API request rejects", async () => {
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    updateApplicationDetailsStub.rejects(new Error("network error"));

    await expectApiFailure();

    expectDraftRetained();
    expectUpdateMetric(distributionStub, "error");
  });

  async function expectApiFailure(): Promise<void> {
    await updateClientDetails(deps)(context, journeyCode).then(
      () => expect.fail("Expected update to fail"),
      (error) => expect(error).to.be.instanceOf(ApiResponseError),
    );
  }

  function expectDraftRetained(): void {
    expect(session.journeyDrafts[draftKey]).to.deep.equal(answers);
    expect(session.journeyDraftVersions[draftKey]).to.equal('"00023"');
  }

  function expectUpdateMetric(
    distributionStub: sinon.SinonStub,
    outcome: "error" | "success",
    status?: number,
  ): void {
    expect(distributionStub.calledOnce).to.equal(true);
    const metric = distributionStub.firstCall.args[2] as {
      attributes: Record<string, number | string>;
    };
    expect(metric.attributes).to.include({
      endpoint: "updateApplicationDetails",
      outcome,
      ...(status === undefined ? {} : { status }),
    });
  }
});
