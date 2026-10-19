import { CryptoProvider } from "@azure/msal-node";
import { expect } from "chai";

import {
  createRelayState,
  decodeRelayState,
  isAllowedRelayTarget,
  parseRelayState,
  verifyRelayState,
} from "#/auth/auth.relay.js";

const SECRET = "test-session-secret";
const NONCE = "550e8400-e29b-41d4-a716-446655440000";
const EXPIRES_AT = 2_000_000_000_000;
const VALID_TARGET =
  "https://el-257-deploy-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";

describe("authRelay", () => {
  describe("createRelayState / parseRelayState roundtrip", () => {
    it("produces a base64-encoded string that parseRelayState can decode", () => {
      const state = createRelayState(NONCE, VALID_TARGET, EXPIRES_AT, SECRET);
      const parsed = parseRelayState(state);

      expect(parsed).to.not.be.null;
      expect(parsed!.nonce).to.equal(NONCE);
      expect(parsed!.target).to.equal(VALID_TARGET);
      expect(parsed!.expiresAt).to.equal(EXPIRES_AT);
      expect(parsed!.signature).to.be.a("string").with.length.greaterThan(0);
    });

    it("classifies a well-formed relay state as valid", () => {
      const state = createRelayState(NONCE, VALID_TARGET, EXPIRES_AT, SECRET);
      expect(decodeRelayState(state).kind).to.equal("valid");
    });

    it("is decodable by MSAL CryptoProvider.base64Decode without error", () => {
      const state = createRelayState(NONCE, VALID_TARGET, EXPIRES_AT, SECRET);
      const crypto = new CryptoProvider();
      const decoded = crypto.base64Decode(state);
      const parsed = JSON.parse(decoded) as Record<string, unknown>;

      expect(parsed).to.have.property("nonce", NONCE);
      expect(parsed).to.have.property("target", VALID_TARGET);
      expect(parsed).to.have.property("expiresAt", EXPIRES_AT);
      expect(parsed).to.have.property("signature");
    });
  });

  describe("parseRelayState", () => {
    it("returns null for a plain (non-relay) state", () => {
      const plain = Buffer.from(JSON.stringify({ nonce: NONCE })).toString(
        "base64",
      );
      expect(parseRelayState(plain)).to.be.null;
    });

    it("returns null for invalid base64", () => {
      expect(parseRelayState("not-valid-base64!!!")).to.be.null;
    });

    it("returns null for non-JSON content", () => {
      const state = Buffer.from("not json").toString("base64");
      expect(parseRelayState(state)).to.be.null;
    });

    it("returns null when fields have wrong types", () => {
      const state = Buffer.from(
        JSON.stringify({ nonce: 123, signature: true, target: null }),
      ).toString("base64");
      expect(parseRelayState(state)).to.be.null;
    });

    it("returns null when expiresAt is missing", () => {
      const state = Buffer.from(
        JSON.stringify({ nonce: NONCE, signature: "signature", target: VALID_TARGET }),
      ).toString("base64");
      expect(parseRelayState(state)).to.be.null;
    });
  });

  describe("decodeRelayState", () => {
    it("classifies malformed relay data as invalid", () => {
      const state = Buffer.from(
        JSON.stringify({ nonce: NONCE, signature: "signature", target: VALID_TARGET }),
      ).toString("base64");

      expect(decodeRelayState(state)).to.deep.equal({ kind: "invalid" });
    });

    it("classifies a plain OAuth state as plain", () => {
      const state = Buffer.from(JSON.stringify({ nonce: NONCE })).toString(
        "base64",
      );
      expect(decodeRelayState(state)).to.deep.equal({ kind: "plain" });
    });
  });

  describe("verifyRelaySignature", () => {
    it("returns true for a valid signature", () => {
      const state = createRelayState(NONCE, VALID_TARGET, EXPIRES_AT, SECRET);
      const parsed = parseRelayState(state)!;
      expect(verifyRelayState(parsed, SECRET, EXPIRES_AT - 1)).to.be.true;
      expect(verifyRelayState(parsed, SECRET, EXPIRES_AT)).to.be.false;
    });

    it("returns false when the signature has been tampered with", () => {
      const state = createRelayState(NONCE, VALID_TARGET, EXPIRES_AT, SECRET);
      const parsed = parseRelayState(state)!;
      parsed.signature = "0".repeat(parsed.signature.length);
      expect(verifyRelayState(parsed, SECRET)).to.be.false;
    });

    it("returns false when the target has been tampered with", () => {
      const state = createRelayState(NONCE, VALID_TARGET, EXPIRES_AT, SECRET);
      const parsed = parseRelayState(state)!;
      parsed.target = "https://external.com";
      expect(verifyRelayState(parsed, SECRET)).to.be.false;
    });

    it("returns false when a different secret is used", () => {
      const state = createRelayState(NONCE, VALID_TARGET, EXPIRES_AT, SECRET);
      const parsed = parseRelayState(state)!;
      expect(verifyRelayState(parsed, "wrong-secret")).to.be.false;
    });

    it("returns false when the signature length differs", () => {
      const state = createRelayState(NONCE, VALID_TARGET, EXPIRES_AT, SECRET);
      const parsed = parseRelayState(state)!;
      parsed.signature = "short";
      expect(verifyRelayState(parsed, SECRET)).to.be.false;
    });
  });

  describe("isAllowedRelayTarget", () => {
    it("accepts a valid ephemeral environment hostname", () => {
      expect(isAllowedRelayTarget(VALID_TARGET)).to.be.true;
    });

    it("accepts single-segment branch prefixes", () => {
      expect(
        isAllowedRelayTarget(
          "https://fix-42-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk",
        ),
      ).to.be.true;
    });

    const hostname = new URL(VALID_TARGET).hostname;
    for (const target of [
      `${VALID_TARGET}:443`,
      `${VALID_TARGET}:8443`,
      `https://user:password@${hostname}`,
      `${VALID_TARGET}/`,
      `${VALID_TARGET}/path`,
      `${VALID_TARGET}?next=/callback`,
      `${VALID_TARGET}#callback`,
      `https://${hostname.toUpperCase()}`,
    ]) {
      it(`rejects a relay target that is not a bare HTTPS origin: ${target}`, () => {
        expect(isAllowedRelayTarget(target)).to.be.false;
      });
    }

    it("rejects an arbitrary external domain", () => {
      expect(isAllowedRelayTarget("https://external.com")).to.be.false;
    });

    it("rejects an http URL (non-HTTPS)", () => {
      expect(
        isAllowedRelayTarget(
          "http://el-257-deploy-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk",
        ),
      ).to.be.false;
    });

    it("rejects the UAT hostname itself (no branch prefix)", () => {
      expect(
        isAllowedRelayTarget(
          "https://laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk",
        ),
      ).to.be.false;
    });

    it("rejects a target with a path component that looks valid", () => {
      expect(
        isAllowedRelayTarget(
          "https://external.com/el-257-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk",
        ),
      ).to.be.false;
    });

    it("rejects a target using a query string to mimic the pattern", () => {
      expect(
        isAllowedRelayTarget(
          "https://external.com?x-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk",
        ),
      ).to.be.false;
    });

    it("rejects a hostname starting with a hyphen", () => {
      expect(
        isAllowedRelayTarget(
          "https://-bad-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk",
        ),
      ).to.be.false;
    });

    it("rejects invalid URLs", () => {
      expect(isAllowedRelayTarget("not-a-url")).to.be.false;
    });
  });
});
