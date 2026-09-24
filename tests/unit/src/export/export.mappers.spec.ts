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

    const viewModel = toExportApplicationViewModel(application);

    expect(viewModel.clientName).to.equal("Jane Doe");
    expect(viewModel.applicationRefNumber).to.equal("CW-123456");
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

    const viewModel = toExportApplicationViewModel(application);

    expect(viewModel.clientName).to.equal(null);
    expect(viewModel.applicationRefNumber).to.equal(null);
  });

  it("returns null for a missing reference", () => {
    const application = getGetApplicationResponseMock({
      applicationRefNumber: null,
    });

    expect(toExportApplicationViewModel(application).applicationRefNumber).to
      .equal(null);
  });

  it("includes the client and case details section", () => {
    const application = getGetApplicationResponseMock({
      clientDetails: {
        ...getGetApplicationResponseMock().clientDetails,
        firstName: "Jane",
        lastName: "Doe",
      },
    });

    const { clientAndCaseDetails } = toExportApplicationViewModel(application);

    expect(clientAndCaseDetails.firstName).to.equal("Jane");
    expect(clientAndCaseDetails.lastName).to.equal("Doe");
  });
});
