---
applyTo: "**/*.njk, src/journeys/**, src/scss/**, src/browser/**"
---

## Templates

- Nunjucks in `src/views/`; base layout `base.njk`.
- Use GOV.UK Design System macros from `@ministryofjustice/frontend`.
- User-facing strings via i18next: `t('key')` in templates; keys in `locales/en.json`.
- No inline styles; use `src/scss/`.

## Accessibility

- Semantic HTML; WCAG 2.2 AA.
- All form inputs must have a `<label>`.
- GOV.UK error summary and error message patterns for validation.
- Sufficient colour contrast; don't rely on colour alone.

## Journeys (HMPPS Forge)

- Multi-step flows in `src/journeys/` using `@ministryofjustice/hmpps-forge`.
- Each journey owns its steps and effects in a self-contained subdirectory.
- Structure and patterns are defined in `docs/forge.md` — follow it for any journey code you touch.
- Refactor to match `docs/forge.md` incrementally: when editing a journey file, bring only that file (and any file you're directly changing) in line with the doc. Do not proactively refactor unrelated, untouched files in the same journey.
