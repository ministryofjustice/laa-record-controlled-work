import { expect } from "chai";
import sinon from "sinon";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { MissingSessionError } from "#/journeys/journey.errors.js";
import { setSelectedOffice } from "#/journeys/select-office/effects/setSelectedOffice.js";
import type { Office, SelectOfficeContext } from "#/journeys/select-office/select-office.types.js";

const mockOffices: Office[] = [
  { address: "1 High Street, Leeds", code: "LEEDS-01", officeName: "Leeds Office", postCode: "LS1 1AA" },
  { address: "2 King Street, Manchester", code: "MCR-01", officeName: "Manchester Office", postCode: "M1 1BB" },
];

describe("setSelectedOffice", () => {
  let getAnswer: sinon.SinonStub;
  let getData: sinon.SinonStub;
  let getSession: sinon.SinonStub;
  let setData: sinon.SinonStub;
  let session: Record<string, unknown>;
  let context: SelectOfficeContext;

  beforeEach(() => {
    session = {};
    getAnswer = sinon.stub().withArgs("selectOffice").returns("LEEDS-01");
    getData = sinon.stub().withArgs(CONTEXT_DATA_KEYS.officeList).returns(mockOffices);
    getSession = sinon.stub().returns(session);
    setData = sinon.stub();

    context = {
      getAnswer,
      getData,
      getSession,
      setData,
    } as unknown as SelectOfficeContext;
  });

  afterEach(() => sinon.restore());

  it("sets selectedOffice on the session", () => {
    setSelectedOffice()(context);

    expect(session.selectedOffice).to.deep.equal(mockOffices[0]);
  });

  it("sets selectedOffice in context data", () => {
    setSelectedOffice()(context);

    expect(
      setData.calledOnceWithExactly(CONTEXT_DATA_KEYS.selectedOffice, mockOffices[0]),
    ).to.equal(true);
  });

  it("throws Error when the selected office code is not in the office list", () => {
    getAnswer.withArgs("selectOffice").returns("UNKNOWN-CODE");

    expect(() => setSelectedOffice()(context))
      .to.throw(Error, "Office not found for code: UNKNOWN-CODE");
  });

  it("throws MissingSessionError when session is not available", () => {
    getSession.returns(null);

    expect(() => setSelectedOffice()(context))
      .to.throw(MissingSessionError);
  });
});
