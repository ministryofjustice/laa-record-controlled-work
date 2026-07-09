import * as httpModule from "#/lib/http.js";
import { orvalFetcher } from "#/api/client/orvalFetcher.js";
import sinon from "sinon";

describe("orvalFetcher", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("uses GET by default when method is not provided", async () => {
    const getStub = sinon.stub(httpModule.http, "get").resolves({ ok: true } as never);

    await orvalFetcher("/api/v1/applications", {});

    sinon.assert.calledOnceWithExactly(getStub, "/api/v1/applications", {});
  });

  it("routes POST requests to http.post", async () => {
    const postStub = sinon
      .stub(httpModule.http, "post")
      .resolves({ created: true } as never);

    const options = {
      body: JSON.stringify({ value: 1 }),
      headers: { "x-request-id": "abc" },
      method: "POST",
    };

    await orvalFetcher("/api/v1/applications", options);

    sinon.assert.calledOnceWithExactly(
      postStub,
      "/api/v1/applications",
      options.body,
      options,
    );
  });

  it("routes PUT, PATCH and DELETE requests to the corresponding http methods", async () => {
    const putStub = sinon.stub(httpModule.http, "put").resolves({} as never);
    const patchStub = sinon.stub(httpModule.http, "patch").resolves({} as never);
    const deleteStub = sinon.stub(httpModule.http, "delete").resolves({} as never);

    await orvalFetcher("/resource", { body: "{}", method: "PUT" });
    await orvalFetcher("/resource", { body: "{}", method: "PATCH" });
    await orvalFetcher("/resource", { method: "DELETE" });

    sinon.assert.calledOnceWithExactly(putStub, "/resource", "{}", {
      body: "{}",
      method: "PUT",
    });
    sinon.assert.calledOnceWithExactly(patchStub, "/resource", "{}", {
      body: "{}",
      method: "PATCH",
    });
    sinon.assert.calledOnceWithExactly(deleteStub, "/resource", {
      method: "DELETE",
    });
  });
});