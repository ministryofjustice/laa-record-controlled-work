import * as Sentry from "@sentry/browser";

const REPLAY_SESSION_SAMPLE_RATE = 0;
const REPLAY_ERROR_SAMPLE_RATE = 1.0;

/**
 * Creates browser Sentry options with privacy-masked, error-triggered Replay.
 * @param configuration - Public Sentry configuration supplied by the server.
 * @param configuration.dsn - Public Sentry DSN.
 * @param configuration.environment - Deployment environment.
 * @param configuration.release - Deployment release identifier.
 * @returns Browser options, or undefined when no DSN is configured.
 */
export function createSentryOptions(configuration: {
  dsn?: string;
  environment?: string;
  release?: string;
}): Sentry.BrowserOptions | undefined {
  if (!configuration.dsn) {
    return undefined;
  }

  return {
    dsn: configuration.dsn,
    environment: configuration.environment,
    integrations: [
      Sentry.replayIntegration({
        blockAllMedia: true,
        maskAllInputs: true,
        maskAllText: true,
        networkCaptureBodies: false,
      }),
    ],
    release: configuration.release,
    replaysOnErrorSampleRate: REPLAY_ERROR_SAMPLE_RATE,
    replaysSessionSampleRate: REPLAY_SESSION_SAMPLE_RATE,
    sendDefaultPii: false,
  };
}

/** Initializes browser Sentry when the page supplies its public configuration. */
export function setupSentry(): void {
  const configuration = document.querySelector<HTMLScriptElement>(
    "script[data-sentry-dsn]",
  )?.dataset;
  const options = createSentryOptions({
    dsn: configuration?.sentryDsn,
    environment: configuration?.sentryEnvironment,
    release: configuration?.sentryRelease,
  });

  if (options) {
    Sentry.init(options);
  }
}
