/**
 * Resolve the Sentry DSN from environment variables.
 * Prefers `SENTRY_DSN`, falling back to the legacy `SENTRY_KEY` / `SENTRY_PROJECT` pair.
 * @returns {string | undefined}  The resolved DSN, or undefined if Sentry should not be initialised.
 */
export function resolveSentryDsn(): string | undefined {
  if (process.env.SENTRY_DSN) {
    return process.env.SENTRY_DSN;
  }

  if (process.env.SENTRY_KEY && process.env.SENTRY_PROJECT) {
    return `https://${process.env.SENTRY_KEY}@sentry.io/${process.env.SENTRY_PROJECT}`;
  }

  return undefined;
}
