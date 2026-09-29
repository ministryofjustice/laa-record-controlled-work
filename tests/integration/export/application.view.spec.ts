import express from "express";
import request from "supertest";

import { faker } from "@faker-js/faker";
import { expect } from "chai";
import { describe, it } from "mocha";

import config from "#/config.js";
import type { ClientAndCaseDetailsSection } from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.types.js";
import { setupNunjucks } from "#/middleware/setupNunjucks.js";

const formattedAddress = {
  kind: "formatted" as const,
  lines: [
    faker.location.streetAddress(),
    faker.location.city(),
    faker.location.zipCode(),
  ],
};

const clientAndCaseDetails: ClientAndCaseDetailsSection = {
  accessedLegalAidBefore: false,
  address: formattedAddress,
  confirmMerits: faker.lorem.sentence(),
  dateOfBirth: faker.date.birthdate({ max: 90, min: 18, mode: "age" }).toISOString().slice(0, 10),
  ecf: false,
  evidenceCaseIsInScope: faker.lorem.sentence(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  niNumber: `AA${faker.string.numeric(6)}C`,
  protectThemselfOrChildren: "Yes",
  sameMatterDetails: {
    reasonForReapplication: faker.lorem.sentence(),
    sameMatterWithin6Months: true,
  },
  transitionalEuArrangements: "No",
  typeOfFamilyLaw: faker.lorem.words(3),
};

function createViewApp() {
  const app = express();
  setupNunjucks(app);
  app.use((_req, res, next) => {
    res.locals.config = config;
    next();
  });
  app.get("/export", (req, res) => {
    res.render("export/application", {
      applicationRefNumber: req.query.reference ?? null,
      clientAndCaseDetails,
      clientName: req.query.client ?? null,
    });
  });
  return app;
}

describe("export application view", () => {
  it("renders the escaped header values and local assets", async () => {
    const response = await request(createViewApp()).get("/export").query({
      client: "Jane <script> & Doe",
      reference: "CW-<123>",
    });

    expect(response.status).to.equal(200);
    expect(response.text).to.match(
      /<title>Record civil controlled work - Export<\/title>/,
    );
    expect(response.text).to.include("Jane &lt;script&gt; &amp; Doe");
    expect(response.text).to.include("CW-&lt;123&gt;");
    expect(response.text).to.match(
      /<h1[^>]*>Record Controlled Work<\/h1>/,
    );
    expect(response.text).to.match(/<img[^>]+alt="Legal Aid Agency logo"/);
    expect(response.text).to.match(
      /<link[^>]+rel="stylesheet"[^>]+href="\/css\/[^"?]+\.css"/,
    );
    expect(response.text).to.match(
      /<img[^>]+src="\/views\/icons\/laa-logo\.svg"/,
    );
    expect(response.text).to.not.include("ebd50ba0-9ed9-4003-83a8-c11ac07d9e32");
    expect(response.text).to.not.include("providerOfficeCode");
  });

  it("renders Not provided for missing client and reference values", async () => {
    const response = await request(createViewApp()).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text.match(/Not provided/g)).to.have.length(2);
  });

  it("renders the client and case summary values", async () => {
    const response = await request(createViewApp()).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text).to.match(
      /<h2[^>]*>Client and case details<\/h2>/,
    );
    expect(response.text).to.include("ECF");
    expect(response.text).to.include("No");
    expect(response.text).to.include("Type of family law");
    expect(response.text).to.include(clientAndCaseDetails.typeOfFamilyLaw!);
    expect(response.text).to.include(
      "Transitional EU arrangements or an international maintenance agreement?",
    );
    expect(response.text).to.include(
      clientAndCaseDetails.transitionalEuArrangements!,
    );
    expect(response.text).to.include(
      "Legal aid to protect themself or their children",
    );
    expect(response.text).to.include(
      clientAndCaseDetails.protectThemselfOrChildren!,
    );
    expect(response.text).to.include("Evidence case is in scope");
    expect(response.text).to.include(
      clientAndCaseDetails.evidenceCaseIsInScope!,
    );
    expect(response.text).to.include("Confirm merits");
    expect(response.text).to.include(clientAndCaseDetails.confirmMerits!);
    expect(response.text).to.include("Accessed legal aid before");
    expect(response.text).to.include("For the same matter within 6 months");
    expect(response.text).to.include("Yes");
    expect(response.text).to.include("Reason for reapplication");
    expect(response.text).to.include(
      clientAndCaseDetails.sameMatterDetails!.reasonForReapplication!,
    );
    expect(response.text).to.include("First name");
    expect(response.text).to.include(clientAndCaseDetails.firstName);
    expect(response.text).to.include("Last name");
    expect(response.text).to.include(clientAndCaseDetails.lastName);
    expect(response.text).to.include("Date of birth");
    expect(response.text).to.include(clientAndCaseDetails.dateOfBirth);
    expect(response.text).to.include("National Insurance number");
    expect(response.text).to.include(clientAndCaseDetails.niNumber!);
    expect(response.text).to.include("Address");
    expect(response.text).to.include(formattedAddress.lines[0]);
    expect(response.text).to.include(formattedAddress.lines[1]);
    expect(response.text).to.include(formattedAddress.lines[2]);
  });
});
