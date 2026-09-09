import { expect } from "chai";
import sinon from "sinon";

import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { setTaskListStatuses } from "#/journeys/edit-application/effects/setTaskListStatuses.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { Status } from "#/journeys/journey.types.js";

describe("setTaskListStatuses", () => {
  let getData: sinon.SinonStub;
  let setData: sinon.SinonStub;
  let context: EditApplicationContext;

  beforeEach(() => {
    getData = sinon.stub();
    setData = sinon.stub();

    context = {
      getData,
      setData,
    } as unknown as EditApplicationContext;
  });

  afterEach(() => sinon.restore());

  it("sets means, evidence and declaration to Cannot start yet when client details are incomplete", () => {
    const application = getGetApplicationResponseMock({
      clientDetails: {
        id: null,
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        niNumber: "",
        hasFixedAddress: true,
        address: null,
        createdAt: null,
        modifiedAt: null,
      },
      eligibility: null,
      evidence: null,
      declaration: null,
    });

    getData.withArgs(CONTEXT_DATA_KEYS.application).returns(application);

    setTaskListStatuses()(context);

    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.clientDetailsStatus, Status.INCOMPLETE)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.meansAssessment, Status.CANNOT_START)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.evidenceStatus, Status.CANNOT_START)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.declarationStatus, Status.CANNOT_START)).to.equal(true);
  });

  it("sets means assessment to Incomplete when client details are complete but means assessment has not started", () => {
    const application = getGetApplicationResponseMock({
      eligibility: null,
      evidence: null,
      declaration: null,
    });

    getData.withArgs(CONTEXT_DATA_KEYS.application).returns(application);

    setTaskListStatuses()(context);

    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.clientDetailsStatus, Status.COMPLETED)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.meansAssessment, Status.INCOMPLETE)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.evidenceStatus, Status.CANNOT_START)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.declarationStatus, Status.CANNOT_START)).to.equal(true);
  });

  it("sets declaration to Incomplete when means and evidence are complete but declaration is empty", () => {
    const application = getGetApplicationResponseMock({
      eligibility: { data: null, result: { qualified: true } },
      evidence: {
        evidenceExemptionCode: "something",
        evidenceExemptionReason: null,
        expenditureCapitalEvidenceChecklist: null,
        incomeEvidenceChecklist: null,
      },
      declaration: null,
    });

    getData.withArgs(CONTEXT_DATA_KEYS.application).returns(application);

    setTaskListStatuses()(context);

    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.clientDetailsStatus, Status.COMPLETED)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.meansAssessment, Status.COMPLETED)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.evidenceStatus, Status.COMPLETED)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.declarationStatus, Status.INCOMPLETE)).to.equal(true);
  });

  it("sets all statuses to Completed when all task list data is present", () => {
    const application = getGetApplicationResponseMock({
      eligibility: { data: null, result: { qualified: true } },
      evidence: {
        evidenceExemptionCode: "something",
        evidenceExemptionReason: null,
        expenditureCapitalEvidenceChecklist: null,
        incomeEvidenceChecklist: null,
      },
      declaration: {
        declarationConfirmation: true,
        id: null,
        createdAt: null,
        createdBy: null,
        modifiedAt: null,
        modifiedBy: null,
      },
    });

    getData.withArgs(CONTEXT_DATA_KEYS.application).returns(application);

    setTaskListStatuses()(context);

    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.clientDetailsStatus, Status.COMPLETED)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.meansAssessment, Status.COMPLETED)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.evidenceStatus, Status.COMPLETED)).to.equal(true);
    expect(setData.calledWithExactly(CONTEXT_DATA_KEYS.declarationStatus, Status.COMPLETED)).to.equal(true);
  });
});