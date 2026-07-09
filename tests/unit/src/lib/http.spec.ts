import { http } from "#/lib/http.js";
import config from "#/config.js";
import { HttpResponse } from "msw";
import { expect } from "chai";
import sinon from "sinon";

describe("http", () => {
  const BASE_URL = "http://example.com";
  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    config.api.baseUrl = BASE_URL;
    fetchStub = sinon.stub(globalThis, "fetch").resolves(HttpResponse.json({}));
  });

  afterEach(() => {
    sinon.restore();
  });

  it("calls fetcher with GET method", async () => {
    await http.get("/resource", { headers: { "x-test": "1" } });

    expect(fetchStub.calledOnce).to.equal(true);
    const [url, options] = fetchStub.getCall(0).args;
    expect(url).to.equal(`${BASE_URL}/resource`);
    expect(options.method).to.equal("GET");
    expect(options.headers).to.deep.equal({ "x-test": "1" });
  });

  it("calls fetcher with DELETE method", async () => {
    await http.delete("/resource/1");

    expect(fetchStub.calledOnce).to.equal(true);
    const [url, options] = fetchStub.getCall(0).args;
    expect(url).to.equal(`${BASE_URL}/resource/1`);
    expect(options.method).to.equal("DELETE");
  });

  it("serializes POST body and merges JSON content type with caller headers", async () => {
    await http.post(
      "/resource",
      { name: "Test" },
      { headers: { Authorization: "Bearer token" } },
    );

    expect(fetchStub.calledOnce).to.equal(true);
    const [, options] = fetchStub.getCall(0).args;
    expect(options.body).to.equal(JSON.stringify({ name: "Test" }));
    expect(options.method).to.equal("POST");
    expect(options.headers).to.deep.equal({
      authorization: "Bearer token",
      "content-type": "application/json",
    });
  });

  it("serializes PATCH body and sets PATCH method", async () => {
    await http.patch("/resource/1", { active: true });

    expect(fetchStub.calledOnce).to.equal(true);
    const [, options] = fetchStub.getCall(0).args;
    expect(options.method).to.equal("PATCH");
    expect(options.body).to.equal(JSON.stringify({ active: true }));
    expect(options.headers).to.deep.equal({
      "content-type": "application/json",
    });
  });
});