import { expect } from "chai";
import sinon from "sinon";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { MissingSessionError } from "#/journeys/journey.errors.js";
import { autoSelectSingleOffice } from "#/journeys/select-office/effects/autoSelectSingleOffice.js";
import type { Office, SelectOfficeContext } from "#/journeys/select-office/select-office.types.js";

const mockOffice: Office = {
  address: "1 High Street, Leeds",
  code: "LEEDS-01",
  officeName: "Leeds Office",
  postCode: "LS1 1AA",
};

const mockOffices: Office[] = [
  mockOffice,
  { address: "2 King Street, Manchester", code: "MCR-01", officeName: "Manchester Office", postCode: "M1 1BB" },
];

describe("autoSelectSingleOffice", () => {
  let getData: sinon.SinonStub;
  let getSession: sinon.SinonStub;
  let setData: sinon.SinonStub;
  let session: Record<string, unknown>;
  let context: SelectOfficeContext;

  beforeEach(() => {
    session = {};
    getData = sinon.stub().withArgs(CONTEXT_DATA_KEYS.officeList).returns([mockOffice]);
    getSession = sinon.stub().returns(session);
    setData = sinon.stub();

    context = {
      getData,
      getSession,
      setData,
    } as unknown as SelectOfficeContext;
  });

  afterEach(() => sinon.restore());

  describe("when there is exactly one office", () => {
    it("sets selectedOffice on the session and context", () => {
      autoSelectSingleOffice()(context);

      expect(session.selectedOffice).to.deep.equal(mockOffice);
      expect(
        setData.calledOnceWithExactly(CONTEXT_DATA_KEYS.selectedOffice, mockOffice),
      ).to.equal(true);
    });

    it("throws MissingSessionError when session is not available", () => {
      getSession.returns(null);

      expect(() => autoSelectSingleOffice()(context)).to.throw(MissingSessionError);
    });
  });

  describe("when there are multiple offices", () => {
    it("does not set selectedOffice on the session or context", () => {
      getData.withArgs(CONTEXT_DATA_KEYS.officeList).returns(mockOffices);

      autoSelectSingleOffice()(context);

      expect(session.selectedOffice).to.be.undefined;
      expect(setData.called).to.equal(false);
    });
  });
});
