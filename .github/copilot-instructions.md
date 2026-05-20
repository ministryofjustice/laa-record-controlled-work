# MoJ Repository – AI Coding Standards

This repository follows **Ministry of Justice (MoJ) Technical Guidance** and Justice Digital standards. Apply these when generating or modifying code.

## Critical

- **Never** upload PII (personally identifiable information) or secrets to this repo.
- Use GitHub for version control; feature branches; commits: `type(scope): description`; mandatory review before merge.

## Code quality

- Correct, clear, concise (in that order). Tests required for fixes and new features.
- Meaningful names; avoid globals; comment only when necessary (explain why, not how).
- Prefer composition over inheritance; small, single-responsibility units.

## Design & APIs

- SOLID principles; versioned APIs (e.g. /v1/...); RESTful.

## Security

- Parameterised queries; validate inputs; secure auth (OAuth 2.0/JWT); encrypt sensitive data; keep dependencies updated.

## Frontend

- Semantic HTML; accessibility (WCAG 2.2 AA); GOV.UK Design System components preferred; no inline styles.

## AI use

- Use only approved MoJ AI tools; review all AI-generated output; no sensitive data into AI unless approved.

Source: [MoJ Technical Guidance](https://technical-guidance.service.justice.gov.uk/).