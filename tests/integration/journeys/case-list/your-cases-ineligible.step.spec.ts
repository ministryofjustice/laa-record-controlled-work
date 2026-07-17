import { TestRenderResult } from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { yourCasesIneligibleStep } from "#/journeys/your-cases/steps/your-cases-ineligible/your-cases-ineligible.step.js";
import { createForgeTestClientForCaseList } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import sinon from "sinon";
import { getGetApplicationsResponseMock } from "../../../mocks/api/fakers/applications/applications.faker.gen.js";

describe("Your Cases Ineligible step", () => {
  let getApplicationsStub: sinon.SinonStub;
  let client: ReturnType<typeof createForgeTestClientForCaseList>;
  const mockData = getGetApplicationsResponseMock();

  before(() => {
    getApplicationsStub = sinon
      .stub()
      .resolves({ status: 200, data: mockData });
    client = createForgeTestClientForCaseList(
      { getApplications: getApplicationsStub },
      yourCasesIneligibleStep(),
    );
  });

  after(() => {
    sinon.restore();
  });

  describe("GET /your-cases-ineligible", () => {
    let renderResult: TestRenderResult;
    let recordButton: RenderBlock;
    let table: RenderBlock;
    let subNavigation: RenderBlock;

    before(async () => {
      const result = await client.get("/your-cases-ineligible");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [recordButton] = renderResult.getBlocksByVariant("govukLinkButton");
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
    });

    it("renders a sub navigation with the correct items", () => {
      const items = subNavigation.properties.items as {
        text: string;
        href: string;
        active?: boolean;
      }[];
      expect(items[0].text).to.equal("In progress");
      expect(items[0].href).to.equal("/your-cases");
      expect(items[1].text).to.equal("Recorded");
      expect(items[1].href).to.equal("/your-cases-recorded");
      expect(items[2].text).to.equal("Ineligible");
      expect(items[2].href).to.equal("/your-cases-ineligible");
      expect(items[2].active).to.equal(true);
    });

    it("renders a table with the correct columns", () => {
      const head = table.properties.head as { text: string }[];
      expect(head[0].text).to.equal("Client name");
      expect(head[1].text).to.equal("Reference number");
      expect(head[2].text).to.equal("Date recorded");
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
        const { name, applicationRefNumber, modifiedAt } = mockData[i];
        expect(row[0].html).to.include(name);
        expect(row[0].html).to.include(`/cases/${applicationRefNumber}`);
        expect(row[1].text).to.equal(applicationRefNumber);
        expect(row[2].text).to.equal(
          dateFormatter.format(new Date(modifiedAt)),
        );
      }
    });

    it("renders empty value string when getApplications returns an empty array", async () => {
      getApplicationsStub.resolves({ status: 200, data: [] });

      const result = await client.get("/your-cases-ineligible");
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      const [emptyTable] = renderResult.getBlocksByVariant("govukTable");
      const [_, body] = renderResult.getBlocksByVariant("html");
      const rows = emptyTable.properties.rows as {
        html?: string;
        text?: string;
      }[][];

      expect(rows).to.have.length(0);
      expect(body.properties.content).to.equal("You have no ineligible cases");
    });
  });
});
