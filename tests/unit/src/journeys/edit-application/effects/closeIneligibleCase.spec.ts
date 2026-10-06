import * as Sentry from "@sentry/node";
import { expect } from "chai";
import sinon from "sinon";

import config from "#/config.js";
import { closeIneligibleCase } from "#/journeys/edit-application/effects/closeIneligibleCase.js";
import type {
  EditApplicationContext,
  EditApplicationEffectsDeps,
} from "#/journeys/edit-application/editApplication.types.js";

describe("closeIneligibleCase", () => {
  let updateApplicationStatus: sinon.SinonStub;
  let context: EditApplicationContext;
  let deps: EditApplicationEffectsDeps;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    updateApplicationStatus = sinon.stub();
    deps = { updateApplicationStatus } as unknown as EditApplicationEffectsDeps;
    context = {
      getPostData: sinon.stub().returns("close"),
      getRequestParam: sinon.stub().returns("application-id"),
      getRequestHeader: sinon.stub().returns("test-correlation-id"),
      getSession: sinon.stub().returns({ id: "session-id" }),
      getData: sinon.stub().returns(3),
    } as unknown as EditApplicationContext;
  });

  afterEach(() => sinon.restore());

  it("does not call the API or emit a metric for another action", async () => {
    (context.getPostData as sinon.SinonStub).returns("save");
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");

    await closeIneligibleCase(deps)(context);

    expect(updateApplicationStatus.notCalled).to.equal(true);
    expect(distributionStub.notCalled).to.equal(true);
  });

  it("records the resolved status when closing the case", async () => {
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    updateApplicationStatus.resolves({ status: 204 });

    await closeIneligibleCase(deps)(context);

    expect(updateApplicationStatus.calledOnce).to.equal(true);
    expect(
      distributionStub.calledOnceWithMatch(
        "api_response_time",
        sinon.match.number,
        {
          attributes: { endpoint: "updateApplicationStatus", status: 204 },
          unit: "millisecond",
        },
      ),
    ).to.equal(true);
  });

  it("throws on an unexpected status and records that status", async () => {
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    updateApplicationStatus.resolves({ status: 409 });

    try {
      await closeIneligibleCase(deps)(context);
      expect.fail("expected a rejected close");
    } catch (error) {
      expect((error as Error).message).to.equal(
        "updateApplicationStatus did not return 204",
      );
    }
    expect(
      distributionStub.calledOnceWithMatch(
        "api_response_time",
        sinon.match.number,
        {
          attributes: { endpoint: "updateApplicationStatus", status: 409 },
          unit: "millisecond",
        },
      ),
    ).to.equal(true);
  });

  it("rethrows a rejected API operation and records one metric without status", async () => {
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    const cause = new Error("network error");
    updateApplicationStatus.rejects(cause);

    try {
      await closeIneligibleCase(deps)(context);
      expect.fail("expected a rejected close");
    } catch (error) {
      expect(error).to.equal(cause);
    }
    expect(
      distributionStub.calledOnceWithMatch(
        "api_response_time",
        sinon.match.number,
        {
          attributes: { endpoint: "updateApplicationStatus" },
          unit: "millisecond",
        },
      ),
    ).to.equal(true);
  });
});
