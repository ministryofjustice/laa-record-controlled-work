import { fetcher } from "#/lib/fetch.js";
import type { getApplicationsResponseSuccess } from "#/api/client/schema/applications/applications.gen.js";
import { HttpResponse } from "msw";
import { expect } from "chai";
import sinon from "sinon";
import { getGetApplicationsResponseMock } from "../../../mocks/api/fakers/applications/applications.faker.gen.js";
import config from "#/config.js";

const BASE_URL = "http://example.com";

describe("fetcher()", () => {
  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, "fetch").resolves(HttpResponse.json({}));
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns parsed JSON when response is application/json", async () => {
    const mockData = getGetApplicationsResponseMock();

    fetchStub.resolves(HttpResponse.json(mockData));

    const result = await fetcher<getApplicationsResponseSuccess>("/test", {
      method: "GET",
    });

    expect(fetchStub.calledOnce).to.be.true;
    expect(result.data).to.deep.equal(mockData);
    expect(result.status).to.equal(200);
  });

  it("returns text when response has an unrecognised content-type", async () => {
    fetchStub.resolves(HttpResponse.text("plain text"));

    const result = await fetcher<{ data: string; status: number }>("/test", {
      method: "GET",
    });

    expect(fetchStub.calledOnce).to.be.true;
    expect(result.data).to.equal("plain text");
    expect(result.status).to.equal(200);
  });

  it("prepends the configured base URL to the path", async () => {
    config.api.baseUrl = BASE_URL;
    await fetcher("/resource/1", { method: "GET" });

    sinon.assert.calledWithMatch(fetchStub, `${BASE_URL}/resource/1`);
  });

  it("passes caller-supplied headers through unchanged", async () => {
    await fetcher("/test", {
      method: "GET",
      headers: {
        Authorization: "Bearer explicit-token",
        "x-custom": "value",
      },
    });

    expect(fetchStub.calledOnce).to.be.true;
    const [, requestInit] = fetchStub.firstCall.args as [
      string,
      RequestInit,
    ];

    expect(new Headers(requestInit.headers).get("authorization")).to.equal(
      "Bearer explicit-token",
    );
    expect(new Headers(requestInit.headers).get("x-custom")).to.equal("value");
  });
});
