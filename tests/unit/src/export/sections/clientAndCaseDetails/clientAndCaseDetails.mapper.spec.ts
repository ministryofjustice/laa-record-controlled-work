import { expect } from "chai";
import { describe, it } from "mocha";

import type { ExportApplication } from "#/export/export.types.js";

import { toClientAndCaseDetailsSection } from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.mapper.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

type ClientDetails = ExportApplication["clientDetails"];
type ApplicationOverrides = Omit<Partial<ExportApplication>, "clientDetails"> & {
  clientDetails?: Partial<ClientDetails>;
};

function makeApplication(
  overrides: ApplicationOverrides = {},
): ExportApplication {
  const { clientDetails, ...applicationOverrides } = overrides;

  return getGetApplicationResponseMock({
    ...applicationOverrides,
    clientDetails: {
      ...getGetApplicationResponseMock().clientDetails,
      ...clientDetails,
    },
  });
}

function rowValue(
  section: ReturnType<typeof toClientAndCaseDetailsSection>,
  key: string,
) {
  return section.rows.find((row) => row.key.text === key)?.value;
}

describe("toClientAndCaseDetailsSection", () => {
  it("maps client and case details to translated summary rows", () => {
    const section = toClientAndCaseDetailsSection(
      makeApplication({
        clientDetails: {
          address: null,
          dateOfBirth: "1982-01-01",
          firstName: "  Jane  ",
          hasFixedAddress: true,
          lastName: "  Doe  ",
          niNumber: "  AA123456C  ", // gitleaks:allow - fake NI number used to test data mapping
        },
        scopingQuestions: { priorLegalAid: "yesDifferentMatter" },
      }),
    );

    expect(section.heading).to.equal("Client and case details");
    expect(rowValue(section, "Accessed legal aid before")).to.deep.equal({
      text: "Yes",
    });
    expect(rowValue(section, "First name")).to.deep.equal({ text: "Jane" });
    expect(rowValue(section, "Last name")).to.deep.equal({ text: "Doe" });
    expect(rowValue(section, "Date of birth")).to.deep.equal({
      text: "1 January 1982",
    });
    expect(rowValue(section, "National Insurance number")).to.deep.equal({
      text: "AA123456C", // gitleaks:allow - fake NI number used to test data mapping
    });
    expect(rowValue(section, "Address")).to.deep.equal({ html: "" });
  });

  it("maps no prior legal aid to the translated answer", () => {
    const section = toClientAndCaseDetailsSection(
      makeApplication({ scopingQuestions: { priorLegalAid: "no" } }),
    );

    expect(rowValue(section, "Accessed legal aid before")).to.deep.equal({
      text: "No",
    });
    expect(rowValue(section, "For the same matter within 6 months")).to.equal(
      undefined,
    );
  });

  it("maps missing scoping questions to an empty answer", () => {
    const section = toClientAndCaseDetailsSection(
      makeApplication({ scopingQuestions: null }),
    );

    expect(rowValue(section, "Accessed legal aid before")).to.deep.equal({
      text: "",
    });
    expect(rowValue(section, "For the same matter within 6 months")).to.equal(
      undefined,
    );
  });

  it("includes same-matter details and a trimmed reason", () => {
    const section = toClientAndCaseDetailsSection(
      makeApplication({
        reasonForReapplication: "  Further work is required  ",
        scopingQuestions: { priorLegalAid: "yesSameMatter" },
      }),
    );

    expect(rowValue(section, "Accessed legal aid before")).to.deep.equal({
      text: "Yes",
    });
    expect(rowValue(section, "For the same matter within 6 months")).to.deep.equal({
      text: "Yes",
    });
    expect(rowValue(section, "Reason for reapplication")).to.deep.equal({
      text: "Further work is required",
    });
  });

  for (const reasonForReapplication of [undefined, null, "", "   "]) {
    it("includes same-matter row and omits a blank reason", () => {
      const application = makeApplication({
        reasonForReapplication,
        scopingQuestions: { priorLegalAid: "yesSameMatter" },
      });
      application.reasonForReapplication = reasonForReapplication;

      const section = toClientAndCaseDetailsSection(application);

      expect(rowValue(section, "For the same matter within 6 months")).to.deep.equal({
        text: "No",
      });
      expect(rowValue(section, "Reason for reapplication")).to.equal(
        undefined,
      );
    });
  }

  it("includes the NI number row with an empty value when missing", () => {
    const section = toClientAndCaseDetailsSection(
      makeApplication({ clientDetails: { niNumber: undefined } }),
    );

    expect(rowValue(section, "National Insurance number")).to.deep.equal({
      text: "",
    });
  });

  it("escapes address lines before rendering them as HTML", () => {
    const section = toClientAndCaseDetailsSection(
      makeApplication({
        clientDetails: {
          address: {
            addressLine1: "<script>",
            addressLine2: null,
            addressLine3: null,
            addressLine4: null,
            county: null,
            country: "GB",
            createdAt: null,
            id: null,
            modifiedAt: null,
            postCode: null,
            townOrCity: null,
          },
          hasFixedAddress: true,
        },
      }),
    );

    expect(rowValue(section, "Address")).to.deep.include({
      html: "&lt;script&gt;",
    });
  });
});