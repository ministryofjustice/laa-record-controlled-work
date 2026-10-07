import { expect } from "chai";

import { getValidatedReturnTo } from "#/auth/auth.redirect.js";

describe("getValidatedReturnTo", () => {
  for (const value of [undefined, null, [], {}, "", "relative/path"]) {
    it(`uses / for a non-path destination: ${String(value)}`, () => {
      expect(getValidatedReturnTo(value)).to.equal("/");
    });
  }

  for (const value of [
    "https://external.invalid/path",
    "//external.invalid/path",
    "/\\external.invalid",
    "/cases/%ZZ",
    "/cases/%00",
    "/cases\u0001invalid",
    "/cases/%2f%2fexternal.invalid",
    "/cases/%5cexternal.invalid",
    "/cases/%25252f%25252fexternal.invalid",
    "/cases/%25255cexternal.invalid",
    "/cases/%2e%2e/%25252561uth/code/callback",
    "/cases/%252e%252e/auth/code/callback",
    "/cases/%2e%2e//external.invalid",
    "/auth",
    "/AUTH/code/callback",
    "/%61uth/code/callback",
    "/%2561uth/code/callback",
    "/cases/%2e%2e/%61uth/code/callback",
    "/cases/%2e%2e/%252561uth/code/callback",
  ]) {
    it(`uses / for unsafe destination ${value}`, () => {
      expect(getValidatedReturnTo(value)).to.equal("/");
    });
  }

  it("preserves authentication-like prefixes", () => {
    expect(getValidatedReturnTo("/authentication/cases")).to.equal(
      "/authentication/cases",
    );
  });

  it("preserves an encoded literal percent in a path segment", () => {
    expect(getValidatedReturnTo("/cases/rate%25")).to.equal("/cases/rate%25");
  });

  it("preserves deep links and escaped query or fragment data", () => {
    const returnTo = "/cases/one%20two?next=%2Fauth&slash=%5C#summary";

    expect(getValidatedReturnTo(returnTo)).to.equal(returnTo);
  });
});