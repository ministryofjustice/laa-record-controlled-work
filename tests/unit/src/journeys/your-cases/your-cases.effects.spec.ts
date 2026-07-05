import { expect } from "chai";
import { describe, it } from "mocha";
import { yourCasesStep } from "#/journeys/your-cases/steps/your-cases/your-cases.step.js";
import sinon from "sinon";
import { createForgeTestClientForCaseList } from "../../../../integration/utils/helpers.js";
import { getGetApplicationsResponseMock } from "../../../../mocks/api/fakers/applications/applications.faker.gen.js";
import { TestRenderResult } from "@ministryofjustice/hmpps-forge/core/testing";

let getApplicationsStub: sinon.SinonStub;
let client: ReturnType<typeof createForgeTestClientForCaseList>;
const mockData = getGetApplicationsResponseMock();

before(async () => {
  getApplicationsStub = sinon.stub().resolves({ status: 200, data: mockData });
  client = createForgeTestClientForCaseList(
    { getApplications: getApplicationsStub },
    yourCasesStep(),
  );
});

after(() => {
  sinon.restore();
});

describe("LoadYourCaseList", () => {
  it("calls getApplications", async () => {
    await client.get("/your-cases");

    expect(getApplicationsStub.calledOnce).to.be.true;
  });

  it("sets data in context from getApplications", async () => {
    const result = await client.get("/your-cases");
    expect(result.type).to.equal("render");
    const renderResult = result as TestRenderResult;
    expect(renderResult.context.data.caseList).to.deep.equal(mockData);
  });
});
