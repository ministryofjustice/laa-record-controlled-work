import { expect } from "chai";
import sinon from "sinon";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import type { OfficeData } from "#/dto/office/office.dto.js";
import { loadSelectedOffice } from "#/journeys/your-cases/effects/loadSelectedOffice.js";
import type { CaseListContext } from "#/journeys/your-cases/your-cases.types.js";
import { logger } from "#/logger.js";
import { InvalidSelectedOfficeError } from "#/journeys/journey.errors.js";

const validOffice: OfficeData = {
  address: "1 High Street, Leeds, LS1 1AA",
  code: "LEEDS-01",
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

  it("throws Error when selectedOffice in session fails schema validation", () => {
    sinon.stub(logger, "error");
    getSession.returns({
      selectedOffice: { code: "LEEDS-01" }, // missing required fields
    });

    expect(() => loadSelectedOffice()(context))
      .to.throw(InvalidSelectedOfficeError);
  });
});
