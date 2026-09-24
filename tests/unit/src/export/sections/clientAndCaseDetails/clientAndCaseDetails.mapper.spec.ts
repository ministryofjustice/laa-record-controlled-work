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

describe("toClientAndCaseDetailsSection", () => {
  it("maps and normalises the client and case details", () => {
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

    expect(section).to.deep.equal({
      accessedLegalAidBefore: true,
      address: { kind: "formatted", lines: [] },
      confirmMerits: null,
      dateOfBirth: "1 January 1982",
      ecf: false,
      evidenceCaseIsInScope: null,
      firstName: "Jane",
      lastName: "Doe",
      niNumber: "AA123456C", // gitleaks:allow - fake NI number used to test data mapping
      protectThemselfOrChildren: null,
      sameMatterDetails: null,
      transitionalEuArrangements: null,
      typeOfFamilyLaw: null,
    });
  });

  it("maps no prior legal aid to false", () => {
    const section = toClientAndCaseDetailsSection(
      makeApplication({ scopingQuestions: { priorLegalAid: "no" } }),
    );

    expect(section.accessedLegalAidBefore).to.equal(false);
    expect(section.sameMatterDetails).to.equal(null);
  });

  it("maps missing or unrecognised prior legal aid to null", () => {
    for (const scopingQuestions of [null, {}, { priorLegalAid: "yes" }]) {
      const section = toClientAndCaseDetailsSection(
        makeApplication({ scopingQuestions }),
      );

      expect(section.accessedLegalAidBefore).to.equal(null);
      expect(section.sameMatterDetails).to.equal(null);
    }
  });

  it("includes same-matter details and a trimmed reason", () => {
    const section = toClientAndCaseDetailsSection(
      makeApplication({
        reasonForReapplication: "  Further work is required  ",
        scopingQuestions: { priorLegalAid: "yesSameMatter" },
      }),
    );

    expect(section.accessedLegalAidBefore).to.equal(true);
    expect(section.sameMatterDetails).to.deep.equal({
      reasonForReapplication: "Further work is required",
      sameMatterWithin6Months: true,
    });
  });

  for (const reasonForReapplication of [undefined, null, "", "   "]) {
    it("keeps same-matter details but omits a blank reason", () => {
      const application = makeApplication({
        reasonForReapplication,
        scopingQuestions: { priorLegalAid: "yesSameMatter" },
      });
      application.reasonForReapplication = reasonForReapplication;

      expect(
        toClientAndCaseDetailsSection(application).sameMatterDetails,
      ).to.deep.equal({
        reasonForReapplication: null,
        sameMatterWithin6Months: false,
      });
    });
  }

  it("normalises a missing NI number to null", () => {
    const section = toClientAndCaseDetailsSection(
      makeApplication({ clientDetails: { niNumber: undefined } }),
    );

    expect(section.niNumber).to.equal(null);
  });
});