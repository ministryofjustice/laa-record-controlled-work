import { expect } from "chai";

import { resolveSentryDsn } from "#/app/utils/resolveSentryDsn.js";

describe("resolveSentryDsn", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns SENTRY_DSN when set", () => {
    process.env.SENTRY_DSN = "https://example@sentry.io/123";
    delete process.env.SENTRY_KEY;
    delete process.env.SENTRY_PROJECT;

    expect(resolveSentryDsn()).to.equal("https://example@sentry.io/123");
  });

  it("falls back to SENTRY_KEY/SENTRY_PROJECT when SENTRY_DSN is unset", () => {
    delete process.env.SENTRY_DSN;
    process.env.SENTRY_KEY = "abc123";
    process.env.SENTRY_PROJECT = "456";

    expect(resolveSentryDsn()).to.equal("https://abc123@sentry.io/456");
  });

  it("prefers SENTRY_DSN over the legacy key/project pair", () => {
    process.env.SENTRY_DSN = "https://preferred@sentry.io/123";
    process.env.SENTRY_KEY = "abc123";
    process.env.SENTRY_PROJECT = "456";

    expect(resolveSentryDsn()).to.equal("https://preferred@sentry.io/123");
  });

  it("returns undefined when no Sentry env vars are set", () => {
    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_KEY;
    delete process.env.SENTRY_PROJECT;

    expect(resolveSentryDsn()).to.be.undefined;
  });

  it("returns undefined when only SENTRY_KEY is set", () => {
    delete process.env.SENTRY_DSN;
    process.env.SENTRY_KEY = "abc123";
    delete process.env.SENTRY_PROJECT;

    expect(resolveSentryDsn()).to.be.undefined;
  });
});
