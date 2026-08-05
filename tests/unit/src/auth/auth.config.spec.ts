import { expect } from "chai";

import { isEntraAuthorityHost } from "#/auth/auth.config.js";

describe("isEntraAuthorityHost", () => {
  it("returns true for the exact Entra host", () => {
    expect(isEntraAuthorityHost("login.microsoftonline.com")).to.be.true;
  });

  it("returns true for a valid Entra subdomain", () => {
    expect(isEntraAuthorityHost("login2.login.microsoftonline.com")).to.be
      .true;
  });

  it("returns false for a host with a malicious prefix", () => {
    expect(isEntraAuthorityHost("evil-login.microsoftonline.com")).to.be
      .false;
  });

  it("returns false for a host with a malicious suffix", () => {
    expect(isEntraAuthorityHost("login.microsoftonline.com.evil.com")).to.be
      .false;
  });

  it("returns false for an unrelated host", () => {
    expect(isEntraAuthorityHost("localhost")).to.be.false;
  });
});
