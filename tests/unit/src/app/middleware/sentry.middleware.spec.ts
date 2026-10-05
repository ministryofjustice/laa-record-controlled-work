import { expect } from "chai";

import { createSentryOptions } from "#/app/middleware/sentry.middleware.js";

const ENVIRONMENT_KEYS = [
  "SENTRY_ENABLED",
  "SENTRY_DSN",
  "SENTRY_LOGGING_ENABLED",
  "SENTRY_TRACING_ENABLED",
  "SENTRY_TRACES_SAMPLE_RATE",
] as const;

const originalEnvironment = Object.fromEntries(
  ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]),
);

describe("Sentry middleware", () => {
  beforeEach(() => {
    delete process.env.SENTRY_LOGGING_ENABLED;
    delete process.env.SENTRY_TRACING_ENABLED;
    process.env.SENTRY_TRACES_SAMPLE_RATE = "0.25";
  });

  afterEach(() => {
    for (const key of ENVIRONMENT_KEYS) {
      const value = originalEnvironment[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("enables logging and tracing by default", () => {
    const options = createSentryOptions("https://example@sentry.io/123");
    const sampleRate = options.tracesSampler?.({
      inheritOrSampleWith: (fallbackRate) => fallbackRate,
      name: "GET /cases",
    });

    expect(options.integrations).to.have.length(3);
    expect(sampleRate).to.equal(0.25);
  });

  it("omits the console logging integration when logging is disabled", () => {
    process.env.SENTRY_LOGGING_ENABLED = "false";

    const options = createSentryOptions("https://example@sentry.io/123");
    expect(options.integrations).to.have.length(2);
  });

  it("disables trace sampling when tracing is disabled", () => {
    process.env.SENTRY_TRACING_ENABLED = "false";

    const options = createSentryOptions("https://example@sentry.io/123");
    const sampleRate = options.tracesSampler?.({
      inheritOrSampleWith: () => 1,
      name: "GET /cases",
    });

    expect(sampleRate).to.equal(0);
  });
});