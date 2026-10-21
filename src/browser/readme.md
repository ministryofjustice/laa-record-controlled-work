# src/browser

Client-side browser script entry points. Files here are picked up by esbuild and bundled for delivery to the browser — they should not import server-side modules.

| File | Purpose |
|---|---|
| `frontendPackagesEntry.ts` | Initialises browser Sentry, GOV.UK Frontend and MOJ Frontend |
| `sentry.ts` | Configures privacy-masked, error-triggered Sentry Replay |

Browser Sentry uses the existing `SENTRY_ENABLED=true` switch and resolved DSN.
Replay session sampling is disabled (`0`); browser errors trigger Replay uploads
with an error sample rate of `1.0`. Server-side errors alone do not trigger a
Replay. Text and inputs are masked, media is blocked, and network body capture
is disabled.