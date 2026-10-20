import { expect } from "chai";

import { createSentryOptions } from "#/browser/sentry.js";

describe("browser Sentry", () => {
  it("does not initialize without a DSN", () => {
    expect(createSentryOptions({})).to.be.undefined;
  });

  it("buffers replays for errors without sampling ordinary sessions", () => {
    const options = createSentryOptions({
      dsn: "https://example@sentry.io/123",
      environment: "test",
      release: "test-release",
    });

    expect(options).to.include({
      dsn: "https://example@sentry.io/123",
      environment: "test",
      release: "test-release",
      replaysOnErrorSampleRate: 1,
      replaysSessionSampleRate: 0,
      sendDefaultPii: false,
    });
    expect(options?.integrations).to.be.an("array").with.length(1);
  });
});