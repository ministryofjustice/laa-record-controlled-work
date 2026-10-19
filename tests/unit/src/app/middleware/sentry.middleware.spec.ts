import * as Sentry from "@sentry/node";
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

  it("does not sample health or status transactions", () => {
    const options = createSentryOptions("https://example@sentry.io/123");
    const sampleRates = ["/health", "/status"].map((path) =>
      options.tracesSampler?.({
        inheritOrSampleWith: () => 1,
        name: `GET ${path}`,
      }),
    );

    expect(sampleRates).to.deep.equal([0, 0]);
  });

  it("keeps only info, error, and fatal logs", () => {
    const options = createSentryOptions("https://example@sentry.io/123");
    const beforeSendLog = options.beforeSendLog;
    const levels = ["trace", "debug", "info", "warn", "error", "fatal"];
    const results = levels.map((level) => {
      const log = { level, attributes: {} } as Parameters<
        NonNullable<Sentry.NodeOptions["beforeSendLog"]>
      >[0];

      return beforeSendLog?.(log) !== null;
    });

    expect(results).to.deep.equal([false, false, true, false, true, true]);
  });

  it("redacts sensitive log attributes without mutating the original log", () => {
    const options = createSentryOptions("https://example@sentry.io/123");
    const address = "1 Test Street";
    const dateOfBirth = "1990-01-01";
    const firstName = "Test";
    const lastName = "User";
    const niNumber = "ni-number-placeholder";
    const log = {
      level: "info",
      message: `address: ${address}; date of birth: ${dateOfBirth}; first name: ${firstName}; last name: ${lastName}; NI number: ${niNumber}`,
      attributes: {
        address,
        dateOfBirth,
        firstName,
        lastName,
        niNumber,
        outcome: "success",
      },
    } as Parameters<NonNullable<Sentry.NodeOptions["beforeSendLog"]>>[0];

    const sanitizedLog = options.beforeSendLog?.(log);

    expect(sanitizedLog?.message).to.equal(
      `address: ; date of birth: ; first name: ; last name: ; NI number: `,
    );
    expect(sanitizedLog?.attributes).to.deep.equal({ outcome: "success" });
    expect(log.message).to.equal(
      `address: ${address}; date of birth: ${dateOfBirth}; first name: ${firstName}; last name: ${lastName}; NI number: ${niNumber}`,
    );
    expect(log.attributes).to.deep.equal({
      address,
      dateOfBirth,
      firstName,
      lastName,
      niNumber,
      outcome: "success",
    });
  });
});