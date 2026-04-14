import { test, expect } from "../fixtures/index.js";
import { ENTRA_TEST_CONFIG } from "../playwright.config.js";

test("unauthenticated user visiting landing page is redirected to sign in", async ({
  unauthenticated: { page },
}) => {
  await page.goto("/landing");
  await expect(page).toHaveURL(
    new RegExp(
      `login\\.microsoftonline\\.com/${ENTRA_TEST_CONFIG.TENANT_ID}/oauth2`,
    ),
  );
});

// test("unauthenticated user can sign in via Entra and reach the protected page", async ({
//   unauthenticated: { page },
// }) => {
//   // Intercept the Entra authorize redirect and immediately POST back
//   // to the app's redirect URI with a mock auth code — no sign-in form needed.
//   await page.route(
//     /login\.microsoftonline\.com.*\/oauth2.*\/authorize/,
//     async (route) => {
//       const url = new URL(route.request().url());
//       const redirectUri = url.searchParams.get("redirect_uri") ?? "";
//       const state = url.searchParams.get("state") ?? "";

//       await route.fulfill({
//         contentType: "text/html",
//         body: `
//           <html>
//             <body>
//               <form id="callback" method="POST" action="${redirectUri}">
//                 <input type="hidden" name="code" value="mock-auth-code-123" />
//                 <input type="hidden" name="state" value="${state}" />
//               </form>
//               <script>document.getElementById("callback").submit();</script>
//             </body>
//           </html>
//         `,
//       });
//     },
//   );

//   await page.goto("/");

//   await expect(page).toHaveURL("/landing");
// });
