### Functional Error Handling

Service methods that can fail in known, recoverable ways return `Either<E, A>` instead of throwing. This makes error cases explicit in the type signature and forces callers to handle them.

`Either<E, A>` is one of:
- `Success<A>` — the operation succeeded, `.value` is the result
- `Failure<E>` — the operation failed, `.value` is a typed error

```ts
// In a service
async function getAuthCodeUrl(): Promise<Either<AuthError, string>> {
  if (somethingWrong) return failure({ type: 'MissingAuthCodeRequest' });
  return success(url);
}

// In a route
const result = await authService.getAuthCodeUrl();
if (result.isFailure()) {
  const { status, message } = mapAuthErrorToHttp(result.value);
  return res.status(status).send(message);
}
res.redirect(result.value);
```

Use `Either` when there are distinct, named failure modes that the caller should handle differently. Use `throw` for unexpected errors (bugs, network failures) that should bubble up to the global error handler.

Error types are defined as tagged unions in `types/auth-types.ts`. The mapping from error type to HTTP response lives in `src/lib/authErrors.ts`.
