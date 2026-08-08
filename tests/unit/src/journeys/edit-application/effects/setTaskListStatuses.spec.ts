import { expect } from "chai";
import sinon from "sinon";

import { getGetApplicationResponseMock } from "../../../../../mocks/api/rcw/fakers/applications/applications.faker.gen.js";
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
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        niNumber: "",
        hasFixedAddress: true,
        address: {
          addressLine1: "",
          addressLine2: "",
          addressLine3: "",
          addressLine4: "",
          townOrCity: "",
          postCode: "",
          county: "",
          country: "",
        },
      },
      meansAssessmentId: undefined,
      evidence: {},
      declaration: {},
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
      meansAssessmentId: undefined,
      evidence: {},
      declaration: {},
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
      meansAssessmentId: "means-id",
      evidence: {
        evidenceStatus: "DRAFT",
        payeIncomeEvidence: true,
      },
      declaration: {},
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
      meansAssessmentId: "means-id",
      evidence: {
        evidenceStatus: "DRAFT",
        payeIncomeEvidence: true,
      },
      declaration: {
        clientDeclarationStatus: "DRAFT",
        declarationConfirmation: true,
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