import { expect } from "chai";
import sinon from "sinon";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { loadSelectedOffice } from "#/journeys/your-cases/effects/loadSelectedOffice.js";
import type { CaseListContext } from "#/journeys/your-cases/your-cases.types.js";
import { logger } from "#/logger.js";
import { InvalidSelectedOfficeError } from "#/journeys/journey.errors.js";
import { Office } from "#/journeys/select-office/select-office.types.js";

const validOffice: Office = {
  address: "1 High Street, Leeds, LS1 1AA",
  code: "AB12CD",
};

describe("loadSelectedOffice", () => {
  let getSession: sinon.SinonStub;
  let setData: sinon.SinonStub;
  let context: CaseListContext;

  beforeEach(() => {
    getSession = sinon.stub().returns({ selectedOffice: validOffice });
    setData = sinon.stub();

    context = {
      getSession,
      setData,
    } as unknown as CaseListContext;
  });

  afterEach(() => sinon.restore());

  it("sets selectedOffice in context data from session", () => {
    loadSelectedOffice()(context);

    expect(
      setData.calledWithExactly(CONTEXT_DATA_KEYS.selectedOffice, validOffice),
    ).to.equal(true);
  });

  it("does not set selectedOffice when selectedOffice is missing from session", () => {
    getSession.returns({});

    loadSelectedOffice()(context);

    expect(setData.called).to.equal(false);
  });

  it("accepts a selected office containing only its code", () => {
    const codeOnlyOffice = { code: "AB12CD" };
    getSession.returns({ selectedOffice: codeOnlyOffice });

    loadSelectedOffice()(context);

    expect(
      setData.calledWithExactly(
        CONTEXT_DATA_KEYS.selectedOffice,
        codeOnlyOffice,
      ),
    ).to.equal(true);
  });

  it("throws InvalidSelectedOfficeError when selectedOffice in session fails schema validation", () => {
    sinon.stub(logger, "error");
    getSession.returns({
      selectedOffice: { address: 123, code: "AB12CD" },
    });

    expect(() => loadSelectedOffice()(context))
      .to.throw(InvalidSelectedOfficeError);
  });

  it("throws InvalidSelectedOfficeError when selectedOffice code is not a string", () => {
    sinon.stub(logger, "error");
    getSession.returns({ selectedOffice: { code: 123 } });

    expect(() => loadSelectedOffice()(context))
      .to.throw(InvalidSelectedOfficeError);
  });
});
