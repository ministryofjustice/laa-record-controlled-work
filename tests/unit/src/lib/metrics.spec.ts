import * as Sentry from "@sentry/node";
import { expect } from "chai";
import sinon from "sinon";

import * as metrics from "#/lib/metrics.js";

describe("metrics", () => {
  afterEach(() => sinon.restore());

  it("returns the response and records its elapsed time and status", async () => {
    sinon
      .stub(performance, "now")
      .onFirstCall()
      .returns(100)
      .onSecondCall()
      .returns(150);
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    const response = { status: 200, data: { id: "example" } };

    expect(await metrics.time("getApplication", async () => response)).to.equal(
      response,
    );
    expect(
      distributionStub.calledOnceWithExactly("api_response_time", 50, {
        attributes: {
          endpoint: "getApplication",
          outcome: "success",
          status: 200,
        },
        unit: "millisecond",
      }),
    ).to.equal(true);
  });

  it("records a non-2xx response with its actual status", async () => {
    sinon
      .stub(performance, "now")
      .onFirstCall()
      .returns(100)
      .onSecondCall()
      .returns(125);
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    const response = { status: 409 };

    expect(
      await metrics.time("updateApplicationStatus", async () => response),
    ).to.equal(response);
    expect(
      distributionStub.calledOnceWithExactly("api_response_time", 25, {
        attributes: {
          endpoint: "updateApplicationStatus",
          outcome: "error",
          status: 409,
        },
        unit: "millisecond",
      }),
    ).to.equal(true);
  });

  it("uses caller-provided success criteria", async () => {
    sinon
      .stub(performance, "now")
      .onFirstCall()
      .returns(100)
      .onSecondCall()
      .returns(110);
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    const response = { status: 302 };

    await metrics.time(
      "getAllProviderOffices",
      async () => response,
      (status) => status === 200,
    );

    expect(
      distributionStub.calledOnceWithExactly("api_response_time", 10, {
        attributes: {
          endpoint: "getAllProviderOffices",
          outcome: "error",
          status: 302,
        },
        unit: "millisecond",
      }),
    ).to.equal(true);
  });

  it("records a rejected operation once without status and rethrows the error", async () => {
    sinon
      .stub(performance, "now")
      .onFirstCall()
      .returns(100)
      .onSecondCall()
      .returns(120);
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    const error = new Error("request failed");

    try {
      await metrics.time("getApplication", async () => {
        throw error;
      });
      expect.fail("expected the operation to reject");
    } catch (caught) {
      expect(caught).to.equal(error);
    }
    expect(
      distributionStub.calledOnceWithExactly("api_response_time", 20, {
        attributes: { endpoint: "getApplication", outcome: "error" },
        unit: "millisecond",
      }),
    ).to.equal(true);
  });
});
