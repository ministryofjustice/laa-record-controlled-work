---
applyTo: "src/**"
---

## Stack
- **Runtime**: Node.js 25.9.0, TypeScript (ESM), Express 5
- **Auth**: Microsoft Entra ID via MSAL (`@azure/msal-node`); sessions stored in Redis
- **Templates**: Nunjucks (`src/views/`); GOV.UK Frontend components
- **i18n**: i18next; all translations in `locales/en.json`
- **Package manager**: Yarn 4 (corepack); path alias `#/*` → `src/*`

## Key patterns
- **Error handling**: Use `Either` (`success(value)` / `failure(error)`) from `src/lib/either.ts`; don't throw across service boundaries.
- **HTTP status codes**: Named constants from `src/lib/constants/httpStatus.ts`, not magic numbers.
- **Auth guard**: `requireAuth` middleware on all non-public routes.
- **CSRF**: `setupCsrf` middleware on all state-changing routes.
- **Naming**: Route handlers are "handlers", not "controllers". Name services for the provider they wrap (e.g. `EntraService` not `AuthService`).
- **Service purity**: Services return data, never mutate `req`/`req.session`. Handlers own framework interaction.

## TypeScript idioms (TypeScript 6.x / ESM)
- Prefer `function` declarations over arrow expressions for named functions. Use arrows only when tidier (callbacks, inline transforms).
- Colocate types with the owning module (e.g. `auth/auth.types.ts`). `src/@types/` is only for global augmentations.
- Prefer `type` over `interface` unless declaration merging is needed.
- Use `satisfies` for type-safe literals that should retain their narrow type.

## Module patterns
- **Vertical slice / feature module** (e.g. `src/auth/`): Colocate types, config, errors, service, handlers, and routes in a feature-prefixed directory. Prefer for new features.
- Shared utilities and cross-cutting concerns in `src/lib/` and `src/middleware/`.
