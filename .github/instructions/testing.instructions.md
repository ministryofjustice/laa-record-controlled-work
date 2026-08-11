---
applyTo: "tests/**"
---

## Frameworks

- **Unit**: Mocha + TSX; assertions via Chai (`expect`); HTTP testing via Supertest; stubs/spies via Sinon
- **UI**: Playwright (`tests/ui/`)
- **Integration**: Mocha (`tests/integration/`)

## Conventions

- Unit tests in `tests/unit/src/`, mirroring `src/` structure.
- File naming: `<name>.spec.ts`
- `tests/unit/setup.ts` provides env vars — don't redeclare in test files.
- Call `sinon.restore()` in `afterEach`.
- Use `createMockApp()` from `tests/unit/utils.ts` for test Express apps.
- Stub service factory methods (e.g. `ServiceName.create`), not internals.

## Approach

- Test observable behaviour (inputs, outputs, side effects), not implementation.
- Don't test private functions, internal state, or call order unless it's the observable contract.
- Only test behaviour that downstream code depends on.
- Test names describe the outcome (e.g. "returns 302" not "calls redirect with status 302").
