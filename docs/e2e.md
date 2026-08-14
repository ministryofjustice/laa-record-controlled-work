# E2E Test Suite

The suite in `tests/e2e/` is a Playwright-based end-to-end test suite that drives the full docker-compose stack (RCW front-end, RCW API, datastore API, CCQ embedded, mock OAuth2 server).

It is distinct from `tests/ui/`, which is a single-service UI test suite that uses MSW to mock all upstream APIs.

## Structure

```
tests/e2e/
├── playwright.config.ts   # Playwright project config; reads E2E_AUTH_MODE / E2E_BASE_URL
├── playwright.harness.ts  # Extended `test` fixture; handles auth per-worker
├── assertions/            # Reusable page assertion helpers (e.g. task-list status)
├── fixtures/              # Playwright fixture definitions (actor.fixture.ts)
├── flows/                 # Page-interaction helpers composed into specs
│   ├── auth.flow.ts
│   ├── case-list.flow.ts
│   ├── ccq.flow.ts
│   ├── create-case.flow.ts
│   ├── evidence.flow.ts
│   ├── office.flow.ts
│   └── task-list.flow.ts
└── specs/
    ├── smoke/             # Critical-path serial tests (full happy path)
    ├── guards/            # Task-gating / access-control tests
    └── journeys/          # Individual journey variants (ECF dropout, office change, etc.)
```

### Naming conventions

- All test cases must be tagged `@e2e`, the Playwright config uses a `grep` filter on this tag.
- Spec files are named `<subject>.<category>.spec.ts`.
- Flow helpers are named `<subject>.flow.ts` and export named async functions; they never
  contain assertions (`expect` calls belong in specs or `assertions/`).
- Assertion helpers are named `<subject>.assert.ts`.

### Actor pattern

`actor.fixture.ts` exposes an `E2EActor` interface that wraps all flow functions against a single `Page`. Specs receive an `actor` from the Playwright harness and call high-level methods (`actor.completeCreateCaseShortestPath()`, etc.) rather than interacting with page objects directly. This keeps specs readable and insulates them from flow-level changes.

## Running the suite

```sh
# Full stack must be running first:
make dev:docker

# Run all e2e tests (headless):
yarn test:e2e

# Open Playwright UI:
yarn test:e2e:open
```

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:8080` | Base URL for the app under test |
| `E2E_AUTH_MODE` | `mock` | `mock` (mock-oauth2-server) or `entra` (real Entra, not yet implemented) |
| `E2E_MOCK_USERNAME` | `test.user@example.com` | Username submitted on the mock sign-in form |
| `E2E_AUTH_STORAGE_STATE_PATH` | unset | Optional Playwright storage-state file path for pre-authenticated non-mock runs |

## Authentication

In `mock` mode the harness authenticates once per Playwright worker (not per test) by navigating to `/auth/signin`, submitting the mock sign-in form, and storing the resulting session cookies as `storageState`. Each test context is then created with that pre-authenticated storage state, so tests start already signed in.

The mock sign-in form is served by the mock OAuth2 server container at `https://localhost:9090`.

### Auth mode abstraction

Specs should call the mode-aware helpers in `tests/e2e/flows/auth.flow.ts`:

- `signIn(page)`
- `signInWithSingleOffice(page, officeCode)`
- `signInWithMultiOffice(page, officeCodes)`

These route to mock OAuth implementations when `E2E_AUTH_MODE=mock`.
For non-mock modes, `signInWithSingleOffice` and `signInWithMultiOffice`
are currently explicit stubs and will be implemented later.

### Non-mock/deployed preparation

The Playwright harness can now run without mock pre-authentication:

- When `E2E_AUTH_STORAGE_STATE_PATH` is set, that storage state is used for all contexts.
- When `E2E_AUTH_MODE` is non-mock and no storage state path is set, contexts are created unauthenticated.

This keeps spec call-sites stable now, while allowing deployed auth to be implemented in-place later.

## MSW and the UI test suite

`tests/ui/` and local development use [Mock Service Worker (MSW)](https://mswjs.io/) in Node mode (`msw/node`) to intercept outbound HTTP calls made by the RCW app process itself. Handlers live in `msw/handlers/` and are loaded by `msw/dev-server-with-msw.ts` when `RCW_API_MODE=msw` or `PDA_API_MODE=msw`.

The e2e suite does **not** use MSW. When the docker-compose stack is running, `RCW_API_MODE=api` and requests reach the real RCW API container.

### However ...
`PDA_API_MODE=msw` remains active even in docker-compose, the Provider Details API (PDA) is an external dependency and is always stubbed via MSW.

## mock-oauth2-server and office code alignment

The mock OAuth2 server (`ghcr.io/navikt/mock-oauth2-server`) is configured by `mock-oauth2-config.json` in the RCW repo root. It issues JWTs whose claims include `LAA_ACCOUNTS`, a list of office codes the signed-in user is authorised for.

**These codes must match the office codes returned by the MSW PDA stub.**

The PDA fixture (`msw/fixtures/pda.ts`) generates offices deterministically using a fixed faker seed (`12345`). The `LAA_ACCOUNTS` claim in `mock-oauth2-config.json` (and in
`mock-oauth2-login.html`) is kept manually in sync with the first _N_ office codes produced by that seed (`R1XEVG`, `VGHVEY`, `3TVRNM`).

If they diverge, the user will not be offered any matching offices on the select-office screen (or worse, will be offered offices they cannot access), breaking the e2e login flow. The comment
in `msw/fixtures/pda.ts` documents this constraint.

### Why the codes matter to the API tier

RCW API reads `LAA_ACCOUNTS` from the JWT on every request. The `AuthorizedOfficesProvider` service extracts the list of office codes and checks that the `providerOfficeCode` on the application being accessed belongs to the authenticated user. This is the primary authorisation control for application-level access.

The datastore API (`laa-info-and-advice-datastore`) uses the same `providerOfficeCode` field, it filters application queries by office code and stores it on every event, so the same alignment requirement propagates through the full stack.

## mock-oauth2-server across repos

Each repo defines its own `mock-oauth2-server` compose service for standalone use:

| Repo | Config | Purpose |
|---|---|---|
| `laa-record-controlled-work` | `docker/compose/include.mock-oauth.yml` | **Authoritative** config for the full stack; owns the interactive login page and the `LAA_ACCOUNTS` / `FIRM_CODE` claims for all three grant types |
| `laa-record-controlled-work-api` | `docker/compose/include.mock-oauth.yml` | Standalone API testing; uses its own `mock-oauth2-config.json` with a fixed set of office codes for API-level integration tests |
| `laa-info-and-advice-datastore` | `docker/compose/include.mock-oauth.yml` | Standalone datastore testing |

When composing the full stack (`docker-compose.yml` in `laa-record-controlled-work`), RCW's `include.mock-oauth.yml` is the one that runs, the others are excluded. Only one `mock-oauth2-server` container may run at a time.

### OBO token exchange (RCW API → datastore)

RCW API calls the datastore on behalf of the user using a JWT Bearer (On-Behalf-Of) exchange:

1. The user authenticates to RCW via the mock OAuth2 server's `authorization_code` grant.
2. RCW API receives the user's access token. To call the datastore it exchanges that token for a new one using the `urn:ietf:params:oauth:grant-type:jwt-bearer` grant against the same mock OAuth2 server token endpoint.
3. The resulting OBO token is sent as `Authorization: Bearer <obo-token>` to the datastore.
4. The original incoming token is also forwarded as `X-Authorization` so the datastore can extract the user context (office code, firm code) from it.

The mock OAuth2 server's `jwt-bearer` request mapping (the third entry in `mock-oauth2-config.json`) issues an OBO token with `scp: DataStore.Access`, which satisfies the datastore's audience/scope validation.

This is why `mock-oauth2-config.json` contains three separate `requestMappings` covering all three grant types: interactive login (`authorization_code`), token refresh (`refresh_token`), and the OBO exchange (`jwt-bearer`). All three must return consistent `LAA_ACCOUNTS` and `FIRM_CODE` claims so the authorisation chain works end-to-end.
