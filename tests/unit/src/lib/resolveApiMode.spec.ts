import { resolveApiMode } from "#/lib/resolveApiMode.js";
import { expect } from "chai";

describe("resolveApiMode", () => {
  it("uses the service-specific mode when set", () => {
    expect(resolveApiMode("api", "msw")).to.equal("api");
  });

  it("falls back to the legacy mode when service-specific mode is unset", () => {
    expect(resolveApiMode(undefined, "api")).to.equal("api");
  });

  it("defaults to msw when nothing is set", () => {
    expect(resolveApiMode(undefined, undefined)).to.equal("msw");
  });
});
