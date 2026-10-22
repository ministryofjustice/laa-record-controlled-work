import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { parse } from "node-html-parser";
import { type ForgeTestClient } from "@ministryofjustice/hmpps-forge/core/testing";
import { createForgeTestClient } from "../../utils/helpers.js";
import { yourCasesEffectsRegistry } from "#/journeys/your-cases/your-cases.effects.js";
import { yourCasesJourney } from "#/journeys/your-cases/your-cases.journey.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import sinon from "sinon";
import { getGetApplicationsResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const session = {
  selectedOffice: {
    address: "1 High Street, Leeds, LS1 1AA",
    code: "AB12CD",
  },
  singleOffice: false,
};

describe("Your Cases step", () => {
  let getApplicationsStub: sinon.SinonStub;
  let client: ForgeTestClient;
  const mockData = getGetApplicationsResponseMock();

  before(() => {
    getApplicationsStub = sinon
      .stub()
      .resolves({ status: 200, data: mockData });
    client = createForgeTestClient(
      yourCasesJourney,
      yourCasesEffectsRegistry,
      { dependencies: { getApplications: getApplicationsStub } },
    );
  });

  after(() => {
    sinon.restore();
  });

  describe("GET /cases", () => {
    let renderResult: TestRenderResult;
    let recordButton: RenderBlock;
    let selectedOffice: RenderBlock;
    let table: RenderBlock;
    let subNavigation: RenderBlock;

    before(async () => {
      const result = await client.get("/cases", { session });
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [recordButton] = renderResult.getBlocksByVariant("govukLinkButton");
      selectedOffice = renderResult
        .getBlocksByVariant("govukBody")
        .find((b) =>
          String(b.properties.text).includes("Office:"),
        ) as RenderBlock;
      [table] = renderResult.getBlocksByVariant("govukTable");
      [subNavigation] = renderResult.getBlocksByVariant("mojSubNavigation");
    });

    afterEach(() => {
      getApplicationsStub.resolves({ status: 200, data: mockData });
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal("Your cases");
    });

    it("renders a link button", () => {
      expect(recordButton.properties.text).to.equal("Record a new case");
      expect(recordButton.properties.href).to.equal(
        "/cases/new/provider-declaration",
      );
    });

    it("renders a selected office block", () => {
      expect(selectedOffice).to.exist;
      expect(String(selectedOffice.properties.text)).to.include(
        "Office: 1 High Street, Leeds, LS1 1AA (AB12CD)",
      );
    });

    it("renders the change link when singleOffice is false", () => {
      const changeLink = String(selectedOffice.properties.text).includes(
        'href="/select-office/"',
      );
      expect(changeLink).to.be.true;
    });

    it("does not render the change link when singleOffice is true", async () => {
      const result = await client.get("/cases", {
        session: {
          selectedOffice: {
            address: "1 High Street, Leeds, LS1 1AA",
            code: "AB12CD",
          },
          singleOffice: true,
        },
      });
      expect(result.type).to.equal("render");

      const renderResult = result as TestRenderResult;
      const selectedOfficeBlock = renderResult
        .getBlocksByVariant("govukBody")
        .find((b) =>
          String(b.properties.text).includes("Office:"),
        ) as RenderBlock;

      expect(selectedOfficeBlock).to.exist;

      const changeLink = String(selectedOfficeBlock.properties.text).includes(
        'href="/select-office/"',
      );
      expect(changeLink).to.be.false;
    });

    it("renders a code-only selected office for single and multiple office users", async () => {
      for (const singleOffice of [false, true]) {
        const result = await client.get("/cases", {
          session: {
            selectedOffice: { code: "AB12CD" },
            singleOffice,
          },
        });
        expect(result.type).to.equal("render");

        const resultView = result as TestRenderResult;
        const officeBlock = resultView
          .getBlocksByVariant("govukBody")
          .find((b) => String(b.properties.text).includes("Office:"));
        const text = String(officeBlock?.properties.text);

        expect(text).to.include("Office: AB12CD");
        expect(text).not.to.include("undefined");
        expect(text).not.to.include("()");
        expect(text.match(/AB12CD/g)).to.have.length(1);
        expect(text.includes('href="/select-office/"')).to.equal(
          !singleOffice,
        );
      }
    });

    it("renders the office code when its address is empty", async () => {
      const result = await client.get("/cases", {
        session: {
          selectedOffice: { address: "", code: "AB12CD" },
          singleOffice: true,
        },
      });
      expect(result.type).to.equal("render");

      const resultView = result as TestRenderResult;
      const officeBlock = resultView
        .getBlocksByVariant("govukBody")
        .find((b) => String(b.properties.text).includes("Office:"));
      const text = String(officeBlock?.properties.text);

      expect(text).to.include("Office: AB12CD");
      expect(text).not.to.include("()");
      expect(text).not.to.include("undefined");
      expect(text.match(/AB12CD/g)).to.have.length(1);
    });

    it("renders a sub navigation with the correct items", () => {
      const items = subNavigation.properties.items as {
        text: string;
        href: string;
        active?: boolean;
      }[];
      expect(items[0].text).to.equal("In progress");
      expect(items[0].href).to.equal("/cases");
      expect(items[0].active).to.equal(true);
      expect(items[1].text).to.equal("Recorded");
      expect(items[1].href).to.equal("/cases/recorded");
      expect(items[2].text).to.equal("Ineligible");
      expect(items[2].href).to.equal("/cases/ineligible");
    });

    it("renders a table with the correct columns", () => {
      const head = table.properties.head as { text: string }[];
      expect(head[0].text).to.equal("Client name");
      expect(head[1].text).to.equal("Reference number");
      expect(head[2].text).to.equal("Last updated");
    });

    it("renders a table with the correct values", () => {
      const rows = table.properties.rows as {
        html?: string;
        text?: string;
      }[][];
      const dateFormatter = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Europe/London",
      });

      expect(rows).to.have.length(mockData.length);

      for (const [i, row] of rows.entries()) {
        const { id, name, applicationRefNumber, modifiedAt } = mockData[i];
        expect(row[0].html).to.include(name);
        expect(row[0].html).to.include(`/cases/${id}/task-list`);
        expect(row[1].text).to.equal(applicationRefNumber);
        expect(row[2].text).to.equal(
          dateFormatter.format(new Date(modifiedAt)),
        );
      }
    });

    it("renders stored client names as text inside their case links", async () => {
      const application = mockData[0];
      const clientName = `O'Neil & Sons <img src=x onerror="alert(1)">`;
      getApplicationsStub.resolves({
        status: 200,
        data: [{ ...application, name: clientName }],
      });

      const result = await client.get("/cases", { session });
      expect(result.type).to.equal("render");

      const [renderedTable] = (result as TestRenderResult).getBlocksByVariant(
        "govukTable",
      );
      const rows = renderedTable.properties.rows as { html?: string }[][];
      const [firstRow] = rows;
      const [clientNameCell] = firstRow;
      const html = parse(clientNameCell.html ?? "");
      const link = html.querySelector("a");

      expect(link?.text).to.equal(clientName);
      expect(link?.querySelector("img, script")).to.equal(null);
    });

    it("renders empty value string when getApplications returns an empty array", async () => {
      getApplicationsStub.resolves({ status: 200, data: [] });

      const result = await client.get("/cases", { session });
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      const allTables = renderResult.getBlocksByVariant("govukTable");
      const visibleTables = allTables.filter(
        (b) => b.properties.visibleWhen !== false,
      );
      const body = renderResult
        .getBlocksByVariant("govukBody")
        .find((b) =>
          String(b.properties.text).includes(
            "You have no cases in progress",
          ),
        ) as RenderBlock;

      expect(visibleTables).to.have.length(0);
      expect(body).to.exist;
    });

    it("redirects to /select-office when selected office is missing", async () => {
      const result = await client.get("/cases", { session: {} });
      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal("/select-office");
    });
  });
});
