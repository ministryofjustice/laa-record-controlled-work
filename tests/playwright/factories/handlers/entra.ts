/**
 * Entra Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to entra and serves mock responses.
 */

import { http, HttpResponse } from "msw";

/**
 * API handlers that intercept outbound requests from the Express app specifically for entra-related endpoints
 */

export const entraHandlers = [
  // intercepts entra authorisation requests
  http.get(
    "https://login.microsoftonline.com/:tenant/oauth2/v2.0/authorize",
    ({ request }) => {
      const url = new URL(request.url);

      const redirectUri = url.searchParams.get("redirect_uri");
      const state = url.searchParams.get("state");

      // Simulate auth code response
      const redirectUrl = new URL(redirectUri!);
      redirectUrl.searchParams.set("code", "mock-auth-code-123");
      if (state) {
        redirectUrl.searchParams.set("state", state);
      }

      return HttpResponse.redirect(redirectUrl.toString(), 302);
    },
  ),
];
