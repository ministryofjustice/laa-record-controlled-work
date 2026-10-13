import { execFileSync } from "node:child_process";

import { expect } from "chai";

interface CookieSecurityConfig {
  csrfSecure: boolean;
  sessionName: string;
  sessionSecure: boolean | "auto";
}

const CONFIG_SCRIPT = `
  import config from "./src/config.ts";
  console.log(JSON.stringify({
    csrfSecure: config.csrf.secure,
    sessionName: config.session.name,
    sessionSecure: config.session.cookie.secure,
  }));
`;

const loadCookieSecurityConfig = (
  nodeEnvironment: string,
  useHttps?: string,
): CookieSecurityConfig => {
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

  return JSON.parse(
    execFileSync("./node_modules/.bin/tsx", ["-e", CONFIG_SCRIPT], {
      encoding: "utf8",
      env: environment,
    }),
  ) as CookieSecurityConfig;
};

describe("config cookie security", () => {
  it("uses secure cookies by default in production", () => {
    expect(loadCookieSecurityConfig("production")).to.deep.equal({
      csrfSecure: true,
      sessionName: "__Host-rcw.sid",
      sessionSecure: true,
    });
  });

  it("uses HTTP-compatible cookies by default in Docker", () => {
    expect(loadCookieSecurityConfig("docker")).to.deep.equal({
      csrfSecure: false,
      sessionName: "rcw.sid",
      sessionSecure: "auto",
    });
  });

  it("allows HTTPS to be disabled in production", () => {
    expect(loadCookieSecurityConfig("production", "false")).to.deep.equal({
      csrfSecure: false,
      sessionName: "rcw.sid",
      sessionSecure: "auto",
    });
  });

  it("allows HTTPS to be enabled in Docker", () => {
    expect(loadCookieSecurityConfig("docker", "true")).to.deep.equal({
      csrfSecure: true,
      sessionName: "__Host-rcw.sid",
      sessionSecure: true,
    });
  });
});