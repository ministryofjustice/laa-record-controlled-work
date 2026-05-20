---
applyTo: "tests/**"
---

# Testing

## Frameworks

- **Unit**: Mocha + TSX; assertions via Chai (`expect`); HTTP testing via Supertest; stubs/spies via Sinon
- **E2E**: Playwright (`tests/playwright/`)
- **Integration**: Mocha (`tests/integration/`)

## Conventions

- Unit test files live in `tests/unit/src/`, mirroring the `src/` directory structure.
- File naming: `<name>.spec.ts`
- `tests/unit/setup.ts` provides required env vars — do not redeclare them in individual test files.
- Always call `sinon.restore()` in `afterEach` to clean up stubs.
- Use `createMockApp()` from `tests/unit/utils.ts` to create a test Express application.
- Stub service factory methods (e.g. `ServiceName.create`) rather than internal implementation details.

## Commands

| Command | Purpose |
|---------|---------|
| `make unit` | Run all unit tests |
| `make unit file=<name>` | Run a single test file (e.g. `make unit file=services/auth`) |
| `yarn test:watch` | Unit tests in watch mode |
| `make e2e` | Build + run Playwright tests headlessly |
| `make e2e-ui` | Playwright in interactive UI mode |
| `make test-all` | Unit + E2E + lint |
| `yarn coverage` | Unit tests with c8 coverage report |
