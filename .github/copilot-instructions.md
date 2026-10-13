## Critical

- **Never** include PII (personally identifiable information) or secrets in generated code.
- Commit messages: `type(scope): description`.

## Code quality

- Correct, clear, concise (in that order).
- Meaningful names; avoid globals; comment only when necessary (why, not how).
- Composition over inheritance; small, single-responsibility units.
- Do not use "canonical" or its variations. Name the specific guarantee, such as a normalized path, same-origin URL, or validated destination.
- Do not use `ReturnType<typeof X>` unless it is absolutely required. Use concrete types.

## Design & APIs

- SOLID principles; versioned APIs (e.g. /v1/...); RESTful.

## AI use

- Prefer concise responses; avoid restating requirements or unnecessary preamble.
- Do not add comments, docstrings, or type annotations to code you haven't changed.
- When generating code, produce only the changed sections with sufficient context, not entire files.