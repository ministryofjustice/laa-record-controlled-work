# src/browser

Client-side browser script entry points. Files here are picked up by esbuild and bundled for delivery to the browser — they should not import server-side modules.

| File | Purpose |
|---|---|
| `frontendPackagesEntry.ts` | Initialises GOV.UK Frontend and MOJ Frontend |