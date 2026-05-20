---
applyTo: "src/**"
---

# Architecture

## Stack

- **Runtime**: Node.js 25.9.0, TypeScript (ESM), Express 5
- **Auth**: Microsoft Entra ID via MSAL (`@azure/msal-node`); sessions stored in Redis
- **Templates**: Nunjucks (`src/views/`); GOV.UK Frontend components
- **i18n**: i18next; all translations in `locales/en.json`
- **HTTP client**: Axios via `BaseApiService` (`src/services/baseApiService.ts`)
- **Package manager**: Yarn 4 (corepack); path alias `#/*` → `src/*`
- **Secrets**: 1Password (`op run --env-file=.env`) in development — never hardcode

## Project structure

```
src/
  controllers/   # Route handlers; call services, render views
  services/      # API clients extending BaseApiService
  middleware/    # Express middleware (auth, CSRF, Helmet, rate-limit, i18n)
  routes/        # Express router definitions
  views/         # Nunjucks templates
  lib/           # Shared utilities and constants
  config/        # App and auth configuration
  types/         # TypeScript type definitions
```

## Key patterns

- **Error handling**: Use `Either` (`success(value)` / `failure(error)`) from `src/lib/either.ts`; do not throw across service boundaries.
- **HTTP status codes**: Import named constants from `src/lib/constants/httpStatus.ts`, not magic numbers.
- **Auth guard**: `requireAuth` middleware applied to all non-public routes.
- **CSRF**: `setupCsrf` middleware active on all state-changing routes.
- **Services**: Extend `BaseApiService`; configure `baseUrl`, `apiPrefix`, and optional `timeout`.

