import type { AuthorizeResponse } from "@azure/msal-node";
import { URLSearchParams } from "node:url";
import type { StartedTestContainer } from "testcontainers";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: string;
  scope?: string;
}

/**
 *
 * @param idpContainer
 * @param claims
 */
export async function getTestToken(
  idpContainer: StartedTestContainer,
  claims: Record<string, string> = {},
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- TODO
  const port = idpContainer.getMappedPort(8080);
  const res = await fetch(`http://localhost:${port}/default/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "test-client",
      client_secret: "test-secret",
      scope: "openid profile",
      ...claims,
    }),
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- TODO
  return ((await res.json()) as TokenResponse).access_token;
}

/**
 *
 * @param idpContainer
 * @param claims
 * @param state
 */
export async function getAuthCode(
  idpContainer: StartedTestContainer,
  state: string,
): Promise<AuthorizeResponse> {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- TODO
  const port = idpContainer.getMappedPort(8080);
  const url = new URL(`http://localhost:${port}/default/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", "test-client");
  url.searchParams.set("redirect_uri", "http://localhost/auth/code/callback");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "openid profile");
  url.searchParams.set("response_mode", "query");

  const res = await fetch(url, {
    method: "GET",
    redirect: "manual",
  });
  const location = res.headers.get("location") ?? "";
  if (!location)
    throw new Error(`IDP did not redirect got ${res.status} from ${location}`);
  const params = new URL(location, "http://localhost").searchParams;

  return { code: params.get("code") ?? "", state: params.get("state") ?? "" };
}
