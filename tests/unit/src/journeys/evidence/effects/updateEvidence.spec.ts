import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";
import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import { ApiResponseError } from "#/api/clients/api.errors.js";
import config from "#/config.js";
import { updateEvidence } from "#/journeys/evidence/effects/updateEvidence.js";
import type { EvidenceContext, EvidenceEffectsDeps } from "#/journeys/evidence/evidence.types.js";
import { logger } from "#/logger.js";

describe("updateEvidence", () => {
  const journeyCode = "evidence";
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";

  const incomeAnswers = {
    doYouHaveEvidence: "yes",
    employedEvidence: ["wageSlips"],
    selfEmployedEvidence: ["cashBook"],
    benefitsInKindEvidence: [],
    otherEvidence: [],
    stateBenefitsEvidence: [],
    asylumSupportEvidence: [],
    taxCreditsEvidence: [],
    incomeEvidence: ["wageSlips"],
    housingCostsEvidence: ["mortgageStatement"],
    childCareEvidence: [],
    maintenanceEvidence: [],
    capitalEvidence: ["bankStatementCapital"],
  };

  const exemptionAnswers = {
    doYouHaveEvidence: "no",
    reasonForNoEvidence: "adviceOverPhone",
    moreDetailsForNoEvidence: "Client was advised over the phone",
  };

  let context: EvidenceContext;
  let updateApplicationEvidenceStub: sinon.SinonStub;
  let deps: EvidenceEffectsDeps;
  let getSession: sinon.SinonStub;
  let getRequestParam: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    updateApplicationEvidenceStub = sinon.stub();
    deps = { updateApplicationEvidence: updateApplicationEvidenceStub };
    getSession = sinon.stub().returns({
      id: "session-id",
      journeyDrafts: { [journeyCode]: incomeAnswers },
      msal: { homeAccountId: "home-account-id" },
    });
    getRequestParam = sinon.stub().returns(applicationId);

    context = { getSession, getRequestParam, setData: sinon.stub() } as unknown as EvidenceContext;
  });

  afterEach(() => sinon.restore());

  describe("when doYouHaveEvidence is yes", () => {
    it("calls the API with income and expenditure/capital checklists", async () => {
      updateApplicationEvidenceStub.resolves({ status: 204 });

      await updateEvidence(deps)(context, journeyCode);

      expect(
        updateApplicationEvidenceStub.calledOnceWith(applicationId, {
          incomeEvidenceChecklist: {
            employedEvidence: incomeAnswers.employedEvidence,
            selfEmployedEvidence: incomeAnswers.selfEmployedEvidence,
            benefitsInKindEvidence: incomeAnswers.benefitsInKindEvidence,
            otherEvidence: incomeAnswers.otherEvidence,
            stateBenefitsEvidence: incomeAnswers.stateBenefitsEvidence,
            asylumSupportEvidence: incomeAnswers.asylumSupportEvidence,
            taxCreditsEvidence: incomeAnswers.taxCreditsEvidence,
          },
          expenditureCapitalEvidenceChecklist: {
            incomeEvidence: incomeAnswers.incomeEvidence,
            housingCostsEvidence: incomeAnswers.housingCostsEvidence,
            childCareEvidence: incomeAnswers.childCareEvidence,
            maintenanceEvidence: incomeAnswers.maintenanceEvidence,
            capitalEvidence: incomeAnswers.capitalEvidence,
          },
        }),
      ).to.equal(true);
    });
  });

  describe("when doYouHaveEvidence is no", () => {
    beforeEach(() => {
      getSession.returns({
        id: "session-id",
        journeyDrafts: { [journeyCode]: exemptionAnswers },
        msal: { homeAccountId: "home-account-id" },
      });
    });

    it("calls the API with exemption code and reason", async () => {
      updateApplicationEvidenceStub.resolves({ status: 204 });

      await updateEvidence(deps)(context, journeyCode);

      expect(
        updateApplicationEvidenceStub.calledOnceWith(applicationId, {
          evidenceExemptionCode: "adviceOverPhone",
          evidenceExemptionReason: "Client was advised over the phone",
        }),
      ).to.equal(true);
    });
  });

  it("returns early when session has no journey draft answers", async () => {
    getSession.returns({
      currentApplicationId: applicationId,
      id: "session-id",
      msal: { homeAccountId: "home-account-id" },
    });

    await updateEvidence(deps)(context, journeyCode);

    expect(updateApplicationEvidenceStub.called).to.equal(false);
  });

  it("throws ApiResponseError when currentApplicationId is missing from session", async () => {
    getRequestParam.returns(undefined);
    sinon.stub(logger, "error");

    try {
      await updateEvidence(deps)(context, journeyCode);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }
  });

  it("throws ApiResponseError when doYouHaveEvidence has an unexpected value", async () => {
    getSession.returns({
      id: "session-id",
      journeyDrafts: { [journeyCode]: { doYouHaveEvidence: "maybe" } },
      msal: { homeAccountId: "home-account-id" },
    });
    sinon.stub(logger, "warn");
    sinon.stub(logger, "error");

    try {
      await updateEvidence(deps)(context, journeyCode);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }
  });

  it("throws ApiResponseError when the API returns non-204", async () => {
    updateApplicationEvidenceStub.resolves({
      status: 500,
      data: {},
      headers: new Headers(),
    });
    sinon.stub(logger, "error");

    try {
      await updateEvidence(deps)(context, journeyCode);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }
  });

  it("throws ApiResponseError when the API call rejects", async () => {
    const cause = new Error("network error");
    updateApplicationEvidenceStub.rejects(cause);
    sinon.stub(logger, "error");

    try {
      await updateEvidence(deps)(context, journeyCode);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      expect((error as ApiResponseError).cause).to.equal(cause);
    }
  });
});
