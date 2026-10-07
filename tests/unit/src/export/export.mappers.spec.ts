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

    expect(clientAndCaseDetails.rows).to.deep.include({
      key: { text: "First name" },
      value: { text: "Jane" },
    });
    expect(clientAndCaseDetails.rows).to.deep.include({
      key: { text: "Last name" },
      value: { text: "Doe" },
    });
  });

  it("omits means assessment when it is explicitly not required", () => {
    const application = getGetApplicationResponseMock({
      eligibility: {
        data: { passporting: true },
        result: {
          result_summary: { overall_result: { result: "eligible" } },
        },
      },
      meansAssessmentRequired: false,
    });

    const viewModel = toExportApplicationViewModel(application);

    expect(viewModel.meansAssessment).to.equal(null);
  });

  it("exports saved passported assets without requiring calculations", () => {
    const application = getGetApplicationResponseMock({
      eligibility: {
        data: {
          additional_property_owned: "none",
          bank_accounts: [{ amount: 0 }],
          client_age: "standard",
          immigration_or_asylum: false,
          investments_relevant: false,
          partner: true,
          partner_additional_property_owned: "none",
          partner_bank_accounts: [{ amount: 500 }],
          partner_investments: 1000,
          partner_investments_relevant: true,
          partner_valuables_relevant: false,
          passporting: true,
          property_owned: "none",
          valuables_relevant: false,
          vehicle_owned: true,
          vehicles: [{ vehicle_value: 10000 }],
        },
        result: null,
      },
      meansAssessmentRequired: true,
    });

    const meansAssessment = toExportApplicationViewModel(application)
      .meansAssessment;

    expect(meansAssessment?.calculations).to.deep.equal({
      status: "unavailable",
    });
    expect(meansAssessment?.answerSummaries.map(({ heading }) => heading)).to
      .include.members(["Client assets", "Partner assets"]);
    expect(
      meansAssessment?.answerSummaries.flatMap(({ rows }) =>
        rows.map(({ value }) => value),
      ),
    ).to.include.members(["£0.00", "£500.00", "£1,000.00"]);
    expect(
      meansAssessment?.answerSummaries.some(({ heading, rows }) =>
        `${heading} ${rows.map(({ key }) => key).join(" ")}`.includes("vehicle"),
      ),
    ).to.equal(false);
  });
});
