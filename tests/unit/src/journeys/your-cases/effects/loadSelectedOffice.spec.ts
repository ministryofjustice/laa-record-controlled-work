import { expect } from "chai";
import sinon from "sinon";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { loadSelectedOffice } from "#/journeys/your-cases/effects/loadSelectedOffice.js";
import type { CaseListContext } from "#/journeys/your-cases/your-cases.types.js";
import type { Office } from "#/journeys/select-office/select-office.types.js";
import { logger } from "#/logger.js";

const validOffice: Office = {
  address: "1 High Street, Leeds",
  code: "LEEDS-01",
  officeName: "Leeds Office",
  postCode: "LS1 1AA",
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
      setData.calledOnceWithExactly(CONTEXT_DATA_KEYS.selectedOffice, validOffice),
    ).to.equal(true);
  });

  it("throws Error when selectedOffice is missing from session", () => {
    sinon.stub(logger, "error");
    getSession.returns({});

    expect(() => loadSelectedOffice()(context))
      .to.throw(Error, "Selected office in session is invalid");
  });

  it("throws Error when selectedOffice in session fails schema validation", () => {
    sinon.stub(logger, "error");
    getSession.returns({
      selectedOffice: { code: "LEEDS-01" }, // missing required fields
    });

    expect(() => loadSelectedOffice()(context))
      .to.throw(Error, "Selected office in session is invalid");
  });
});
