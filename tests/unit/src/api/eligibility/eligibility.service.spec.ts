import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import config from "#/config.js";
import type { Success } from "#/lib/either.js";
import { logger } from "#/logger.js";
import {
  type EligibilityAssessment,
  type LoadEligibilityAssessmentDeps,
  type SaveEligibilityAssessmentDeps,
  loadEligibilityAssessment,
  saveEligibilityAssessment,
} from "#/api/eligibility/eligibility.service.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { LoadEligibilityAssessmentError, SaveEligibilityAssessmentError } from "#/api/eligibility/eligibility.errors.js";


describe("saveEligibilityAssessment", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";

  let deps: SaveEligibilityAssessmentDeps;
  let updateApplicationMeansStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    updateApplicationMeansStub = sinon.stub();
    deps = {
      updateApplicationMeans: updateApplicationMeansStub,
    } as unknown as SaveEligibilityAssessmentDeps;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("splits the eligibility assessment and forwards data/result to the RCW API", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {
        api_response: { indication: true },
        level_of_help: "controlled_legal_representation",
      },
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.equal(undefined);
    expect(
      updateApplicationMeansStub.calledOnceWith(applicationId, {
        data: { level_of_help: "controlled_legal_representation" },
        result: { indication: true },
      }),
    ).to.equal(true);
  });

  it("returns a NotAuthenticatedError failure when the session cannot be authenticated", async () => {
    sinon.stub(config.api, "useMockAccessToken").value(false);

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: undefined,
      applicationId,
      sessionId: undefined,
    });

    expect(result.error).to.be.instanceOf(NotAuthenticatedError);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns a SaveEligibilityAssessmentError failure when the RCW API does not return 204", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 500 });
    sinon.stub(logger, "error");

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveEligibilityAssessmentError);
  });

  it("returns a SaveEligibilityAssessmentError failure when the RCW API returns 404", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 404 });
    sinon.stub(logger, "error");

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveEligibilityAssessmentError);
  });

  it("returns a SaveEligibilityAssessmentError failure when the RCW API returns 409", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 409 });
    sinon.stub(logger, "error");

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveEligibilityAssessmentError);
  });

  it("returns a SaveEligibilityAssessmentError failure when the RCW API call rejects", async () => {
    const cause = new Error("network error");
    updateApplicationMeansStub.rejects(cause);
    sinon.stub(logger, "error");

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveEligibilityAssessmentError);
    expect((result.error as SaveEligibilityAssessmentError).cause).to.equal(
      cause,
    );
  });

  it("defaults result to {} and forwards the full assessment as data when api_response is missing", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    await saveEligibilityAssessment(deps, {
      eligibilityAssessment: { level_of_help: "controlled_legal_representation" },
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(
      updateApplicationMeansStub.calledOnceWith(applicationId, {
        data: { level_of_help: "controlled_legal_representation" },
        result: {},
      }),
    ).to.equal(true);
  });

  it("defaults result to {} when api_response is not an object", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    await saveEligibilityAssessment(deps, {
      eligibilityAssessment: { api_response: "not-an-object" },
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(
      updateApplicationMeansStub.calledOnceWith(applicationId, {
        data: {},
        result: {},
      }),
    ).to.equal(true);
  });

  it("defaults both data and result to {} when eligibility_assessment is empty", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(
      updateApplicationMeansStub.calledOnceWith(applicationId, {
        data: {},
        result: {},
      }),
    ).to.equal(true);
  });
});

describe("loadEligibilityAssessment", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";

  function getApplicationResponse(
    dateOfBirth: string,
    eligibility: {
      data: Record<string, unknown> | null;
      result: Record<string, unknown> | null;
    } | null = null,
  ) {
    const response = getGetApplicationResponseMock({
      id: applicationId,
      eligibility,
    });
    response.clientDetails.dateOfBirth = dateOfBirth;
    return response;
  }

  let deps: LoadEligibilityAssessmentDeps;
  let getApplicationStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    getApplicationStub = sinon.stub();
    deps = {
      getApplication: getApplicationStub,
    } as unknown as LoadEligibilityAssessmentDeps;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns the eligibility data/result when a completed assessment is present", async () => {
    getApplicationStub.resolves({
      data: getApplicationResponse("1990-01-01", {
        data: { level_of_help: "controlled_legal_representation" },
        result: { indication: true },
      }),
      status: 200,
    });
    sinon.useFakeTimers(new Date("2026-09-10T12:00:00Z"));

    const result = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment | undefined>;

    expect(result.error).to.equal(undefined);
    expect(result.value).to.deep.equal({
      data: {
        level_of_help: "controlled_legal_representation",
        client_age: "standard",
      },
      result: { indication: true },
    });
  });

  it("returns derived client age when the application has no eligibility assessment", async () => {
    getApplicationStub.resolves({
      data: getApplicationResponse("1990-01-01"),
      status: 200,
    });
    sinon.useFakeTimers(new Date("2026-09-10T12:00:00Z"));

    const result = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment | undefined>;

    expect(result.error).to.equal(undefined);
    expect(result.value).to.deep.equal({ data: { client_age: "standard" } });
  });

  it("returns derived client age when eligibility data/result is malformed or partial", async () => {
    getApplicationStub.resolves({
      data: getApplicationResponse("1990-01-01", {
        data: { level_of_help: "cw" },
        result: null,
      }),
      status: 200,
    });
    sinon.useFakeTimers(new Date("2026-09-10T12:00:00Z"));

    const result = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment | undefined>;

    expect(result.error).to.equal(undefined);
    expect(result.value).to.deep.equal({ data: { client_age: "standard" } });
  });

  it("replaces a saved client age with the value derived from date of birth", async () => {
    getApplicationStub.resolves({
      data: getApplicationResponse("2008-09-11", {
        data: { client_age: "standard" },
        result: { indication: true },
      }),
      status: 200,
    });
    sinon.useFakeTimers(new Date("2026-09-10T12:00:00Z"));

    const result = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment>;

    expect(result.value).to.deep.equal({
      data: { client_age: "under_18" },
      result: { indication: true },
    });
  });

  it("uses under 18 before the 18th birthday and standard on it", async () => {
    sinon.useFakeTimers(new Date("2026-09-10T12:00:00Z"));

    for (const [dateOfBirth, clientAge] of [
      ["2008-09-11", "under_18"],
      ["2008-09-10", "standard"],
    ]) {
      getApplicationStub.resolves({
        data: getApplicationResponse(dateOfBirth),
        status: 200,
      });

      const result = (await loadEligibilityAssessment(deps, {
        applicationId,
        homeAccountId: "home-account-id",
        sessionId: "session-id",
      })) as Success<EligibilityAssessment>;

      expect(result.value?.data.client_age).to.equal(clientAge);
    }
  });

  it("changes age range at the UTC birthday midnight", async () => {
    const clock = sinon.useFakeTimers(new Date("2026-09-10T23:59:59.999Z"));
    getApplicationStub.resolves({
      data: getApplicationResponse("2008-09-11"),
      status: 200,
    });

    const beforeBirthday = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment>;

    expect(beforeBirthday.value?.data.client_age).to.equal("under_18");

    clock.setSystemTime(new Date("2026-09-11T00:00:00.000Z"));

    const onBirthday = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment>;

    expect(onBirthday.value?.data.client_age).to.equal("standard");
  });

  it("uses standard before the 60th birthday and over 60 on it", async () => {
    sinon.useFakeTimers(new Date("2026-09-10T12:00:00Z"));

    for (const [dateOfBirth, clientAge] of [
      ["1966-09-11", "standard"],
      ["1966-09-10", "over_60"],
    ]) {
      getApplicationStub.resolves({
        data: getApplicationResponse(dateOfBirth),
        status: 200,
      });

      const result = (await loadEligibilityAssessment(deps, {
        applicationId,
        homeAccountId: "home-account-id",
        sessionId: "session-id",
      })) as Success<EligibilityAssessment>;

      expect(result.value?.data.client_age).to.equal(clientAge);
    }
  });

  it("handles leap-day dates using calendar birthdays", async () => {
    const clock = sinon.useFakeTimers(new Date("2026-02-28T12:00:00Z"));
    getApplicationStub.resolves({
      data: getApplicationResponse("2008-02-29"),
      status: 200,
    });

    const beforeBirthday = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment>;

    expect(beforeBirthday.value?.data.client_age).to.equal("under_18");

    clock.setSystemTime(new Date("2026-03-01T12:00:00Z"));

    const onBirthday = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment>;

    expect(onBirthday.value?.data.client_age).to.equal("standard");
  });

  it("handles a leap-day client reaching 60 on February 29", async () => {
    const clock = sinon.useFakeTimers(new Date("2028-02-28T12:00:00Z"));
    getApplicationStub.resolves({
      data: getApplicationResponse("1968-02-29"),
      status: 200,
    });

    const beforeBirthday = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment>;

    expect(beforeBirthday.value?.data.client_age).to.equal("standard");

    clock.setSystemTime(new Date("2028-02-29T12:00:00Z"));

    const onBirthday = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment>;

    expect(onBirthday.value?.data.client_age).to.equal("over_60");
  });

  it("returns a NotAuthenticatedError failure when the session cannot be authenticated", async () => {
    sinon.stub(config.api, "useMockAccessToken").value(false);

    const result = await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: undefined,
      sessionId: undefined,
    });

    expect(result.error).to.be.instanceOf(NotAuthenticatedError);
    expect(getApplicationStub.called).to.equal(false);
  });

  it("returns a LoadEligibilityAssessmentError failure when the RCW API does not return 200", async () => {
    getApplicationStub.resolves({ data: undefined, status: 404 });
    sinon.stub(logger, "error");

    const result = await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(LoadEligibilityAssessmentError);
  });

  it("returns a LoadEligibilityAssessmentError failure when the RCW API call rejects", async () => {
    const cause = new Error("network error");
    getApplicationStub.rejects(cause);
    sinon.stub(logger, "error");

    const result = await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(LoadEligibilityAssessmentError);
    expect((result.error as LoadEligibilityAssessmentError).cause).to.equal(
      cause,
    );
  });

  it("returns a LoadEligibilityAssessmentError failure when the response fails validation", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({ id: "not-a-uuid" }),
      status: 200,
    });
    sinon.stub(logger, "error");

    const result = await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(LoadEligibilityAssessmentError);
  });
});
