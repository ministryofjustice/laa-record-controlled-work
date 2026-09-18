import { expect } from "chai";
import { describe, it } from "mocha";

import { toExportApplicationViewModel } from "#/export/export.mappers.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

describe("toExportApplicationViewModel", () => {
  it("trims and joins the client name and reference number", () => {
    const application = getGetApplicationResponseMock({
      applicationRefNumber: "  CW-123456  ",
      clientDetails: {
        ...getGetApplicationResponseMock().clientDetails,
        firstName: "  Jane ",
        lastName: " Doe  ",
      },
    });

    expect(toExportApplicationViewModel(application)).to.deep.equal({
      clientName: "Jane Doe",
      applicationRefNumber: "CW-123456",
    });
  });

  it("returns null for blank names and references", () => {
    const application = getGetApplicationResponseMock({
      applicationRefNumber: "   ",
      clientDetails: {
        ...getGetApplicationResponseMock().clientDetails,
        firstName: "  ",
        lastName: "",
      },
    });

    expect(toExportApplicationViewModel(application)).to.deep.equal({
      clientName: null,
      applicationRefNumber: null,
    });
  });

  it("returns null for a missing reference", () => {
    const application = getGetApplicationResponseMock({
      applicationRefNumber: null,
    });

    expect(toExportApplicationViewModel(application).applicationRefNumber).to
      .equal(null);
  });
});