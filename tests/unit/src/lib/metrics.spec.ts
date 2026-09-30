import * as Sentry from "@sentry/node";
import { expect } from "chai";
import sinon from "sinon";

import * as metrics from "#/lib/metrics.js";

describe("metrics", () => {
  afterEach(() => sinon.restore());

  it("returns the current performance timestamp when timing starts", () => {
    const performanceNowStub = sinon.stub(performance, "now").returns(123.45);

    expect(metrics.start()).to.equal(123.45);
    expect(performanceNowStub.calledOnce).to.equal(true);
  });

  it("sends the elapsed RCW API response time to Sentry", () => {
    sinon.stub(performance, "now").returns(150);
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");

    metrics.duration(100, {
      endpoint: "getApplication",
      status: 200,
    });

    expect(distributionStub.calledOnceWith("api_response_time", 50, {
      attributes: {
        endpoint: "getApplication",
        status: 200,
      },
      unit: "millisecond",
    })).to.equal(true);
  });
});
