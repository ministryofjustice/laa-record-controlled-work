---
description: "Use when asking about build commands, running the service locally, Docker."
---

# Build & Run

| Command | Purpose |
|---------|---------|
| `make watch` | Build + dev server with hot reload (requires 1Password) |
| `make dev` | Run via tsx without a full build |
| `yarn build` | Full TypeScript + esbuild compilation |
| `yarn lint` | ESLint with auto-fix |
| `make docker-up` | Start all services via Docker Compose |
| `make docker-build` | Rebuild and start Docker services |


