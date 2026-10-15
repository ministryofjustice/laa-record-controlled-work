# Means Assessment Fixtures

## Find A Scenario

- `meansAssessment.fixtures.ts`: public catalogue and stable scenario names.
- `builders.ts`: scenario contract, fresh defaults and small payload builders.
- `answers.fixtures.ts`: all entered-answer scenarios in one file.
- `outcomes.fixtures.ts`: exemptions, omission and unavailable-result scenarios.
- `calculations/income.fixtures.ts`: saved monthly income calculation scenarios.

Consumers select scenarios from the public catalogue. Domain modules import
builders directly, never the catalogue. The catalogue re-exports the scenario
type so consumers need only one import path.

## Add A Scenario

1. Add a named `create...Scenario` factory to its owning domain file.
2. Add its enum member and factory to the catalogue.
3. For browser coverage, add a stable synthetic ID to
   `tests/ui/msw/fixtures/rcw.fixtures.ts`. Applications are registered automatically.

Keep existing names and browser IDs stable. Name new scenarios after the
observable distinction, such as uncalculated income or malformed income details.
Calculation scenarios belong under `calculations/`, not in entered-answer fixtures.
Add other calculation-domain files only when needed.

## Keep Data Independent

- Every factory returns fresh nested objects and arrays.
- Client and partner data must not share mutable objects.
- Builders copy supplied overrides instead of retaining caller-owned data.
- Key-total defaults intentionally contain no detailed assessment structures.
- Saved totals intentionally differ from component sums and entered amounts.
- Never derive saved calculation values from entered answers.
- Keep malformed variants used by one test beside that test.
- Keep expected labels and display values in consumer tests.

Fixture contract tests live in `tests/unit/fixtures/meansAssessment.fixtures.spec.ts`.
They check catalogue completeness, API validity, unique browser IDs and isolation.
