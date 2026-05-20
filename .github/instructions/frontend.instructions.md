---
applyTo: "**/*.njk, src/scss/**, src/browser/**"
---

# Frontend / Views

## Templates

- Nunjucks templates in `src/views/`; base layout is `base.njk`.
- Use GOV.UK Design System macros and components from `@ministryofjustice/frontend`.
- All user-facing strings via i18next: use `t('key')` in templates; add keys to `locales/en.json`.
- Never use inline styles; add styles to `src/scss/`.

## Accessibility

- Semantic HTML; target WCAG 2.2 AA.
- All form inputs must have an associated `<label>`.
- Use GOV.UK error summary and error message patterns for form validation feedback.
- Ensure sufficient colour contrast; do not rely on colour alone to convey meaning.
