import { execFileSync } from "node:child_process";

import { expect } from "chai";

interface ConfigSnapshot {
  additionalRedirectUris: string[];
  csrfSecure: boolean;
  sessionName: string;
  sessionSecure: boolean | "auto";
}

const CONFIG_SCRIPT = `
  import config from "./src/config.ts";
  console.log(JSON.stringify({
    csrfSecure: config.csrf.secure,
    additionalRedirectUris: config.entra.additionalRedirectUris,
    sessionName: config.session.name,
    sessionSecure: config.session.cookie.secure,
  }));
`;

const loadConfig = (
  nodeEnvironment: string,
  useHttps?: string,
  additionalRedirectUris?: string,
): ConfigSnapshot => {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    ENTRA_AUTHORITY_BASE_URL: "https://login.microsoftonline.com/",
    ENTRA_CLIENT_ID: "test-client-id",
    ENTRA_CLIENT_SECRET: "test-client-secret",
    ENTRA_REDIRECT_URI: "http://localhost/auth/code/callback",
    ENTRA_TENANT_ID: "test-tenant-id",
    NODE_ENV: nodeEnvironment,
    PDA_API_KEY: "test-pda-api-key",
    SESSION_SECRET: "test-secret",
  };

  if (useHttps === undefined) {
    delete environment.USE_HTTPS;
  } else {
    environment.USE_HTTPS = useHttps;
  }
  if (additionalRedirectUris === undefined) {
    delete environment.ENTRA_ADDITIONAL_REDIRECT_URIS;
  } else {
    environment.ENTRA_ADDITIONAL_REDIRECT_URIS = additionalRedirectUris;
  }

  return JSON.parse(
    execFileSync("./node_modules/.bin/tsx", ["-e", CONFIG_SCRIPT], {
      encoding: "utf8",
      env: environment,
    }),
  ) as ConfigSnapshot;
};

describe("config cookie security", () => {
  it("uses secure cookies by default in production", () => {
    expect(loadConfig("production")).to.deep.equal({
      additionalRedirectUris: [],
      csrfSecure: true,
      sessionName: "__Host-rcw.sid",
      sessionSecure: true,
    });
  });

  it("uses HTTP-compatible cookies by default in Docker", () => {
    expect(loadConfig("docker")).to.deep.equal({
      additionalRedirectUris: [],
      csrfSecure: false,
      sessionName: "rcw.sid",
      sessionSecure: "auto",
    });
  });

  it("allows HTTPS to be disabled in production", () => {
    expect(loadConfig("production", "false")).to.deep.equal({
      additionalRedirectUris: [],
      csrfSecure: false,
      sessionName: "rcw.sid",
      sessionSecure: "auto",
    });
  });

  it("allows HTTPS to be enabled in Docker", () => {
    expect(loadConfig("docker", "true")).to.deep.equal({
      additionalRedirectUris: [],
      csrfSecure: true,
      sessionName: "__Host-rcw.sid",
      sessionSecure: true,
    });
  });
});

describe("Entra callback configuration", () => {
  it("parses additional callback URIs from a comma-separated environment value", () => {
    expect(
      loadConfig(
        "production",
        undefined,
        " https://old.example.test/auth/code/callback, https://uat.example.test/auth/code/callback ",
      ).additionalRedirectUris,
    ).to.deep.equal([
      "https://old.example.test/auth/code/callback",
      "https://uat.example.test/auth/code/callback",
    ]);
  });
});