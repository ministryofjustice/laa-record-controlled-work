# Dynamic Application Security Testing (DAST)

DAST scans the running application from the outside, exercising real HTTP requests and responses, to find vulnerabilities that only appear at runtime (e.g. missing security headers, reflected content, session handling issues).

## Tool

[OWASP ZAP](https://www.zaproxy.org/) is RCW's DAST tool, run as part of the ZAP Automation Framework against the full Docker Compose stack.

## Pattern

RCW's app enforces real MSAL/Entra login with no test bypass, so ZAP cannot authenticate itself directly. Instead, the scan reuses traffic already recorded by the e2e suite:

1. The e2e Playwright tests log in for real (against the mock OAuth2 server) and exercise the application's journeys.
2. Each browser context records a HAR (a JSON archive of the requests/responses it made), which is merged into a single authenticated seed file.
3. ZAP imports that HAR, then spiders and actively scans the still-running stack starting from the areas the HAR covered.

This gives ZAP authenticated coverage without needing its own login flow. Because the spider and active scan crawl the live app, the stack must still be running when they execute, so the scan runs as the final steps of the e2e job rather than a separate workflow that would need to start its own stack.

## Where this is implemented

See [zap/zap.md](../zap/zap.md) for the full operational detail: how to run a scan locally, the exact scan flow, file responsibilities, generated reports, CI behaviour, and troubleshooting.

## Result handling

The scan fails on ZAP plan errors, but reported warnings/alerts do not fail the job - they're surfaced via the uploaded HTML/JSON reports for review, not treated as automatic blockers.
