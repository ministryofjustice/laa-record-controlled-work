import type { FullConfig } from "@playwright/test";

import { setTimeout as delay } from "node:timers/promises";

const HEALTH_POLL_INTERVAL_MS = 1500;
const DEFAULT_STACK_READY_TIMEOUT_MS = 120000;
const FIRST_PROJECT_INDEX = 0;
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const MIN_TIMEOUT_MS = 1;

interface PollOptions {
  isReady: (status: number) => boolean;
  name: string;
  timeoutMs: number;
  url: string;
}

interface PollState {
  lastError: string;
  lastStatus?: number;
}

const pollUntilReady = async (
  options: PollOptions,
  startedAt: number = Date.now(),
  state: PollState = { lastError: "" },
): Promise<void> => {
  const { isReady, name, timeoutMs, url } = options;

  if (Date.now() - startedAt > timeoutMs) {
    const statusText =
      state.lastStatus === undefined
        ? `last error: ${state.lastError || "unknown"}`
        : `last status: ${state.lastStatus}`;

    throw new Error(
      `[e2e global setup] Timed out waiting for ${name} at ${url} (${statusText}).`,
    );
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
    });

    const nextState: PollState = {
      ...state,
      lastStatus: response.status,
    };

    if (isReady(response.status)) {
      return;
    }

    await delay(HEALTH_POLL_INTERVAL_MS);
    await pollUntilReady(options, startedAt, nextState);
  } catch (error) {
    const nextState: PollState = {
      ...state,
      lastError: error instanceof Error ? error.message : String(error),
    };

    await delay(HEALTH_POLL_INTERVAL_MS);
    await pollUntilReady(options, startedAt, nextState);
  }
};

/**
 * Waits for the docker-compose stack endpoints to become available.
 * @param config Playwright full config object.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const configuredBaseUrl =
    process.env.E2E_BASE_URL ??
    config.projects[FIRST_PROJECT_INDEX]?.use?.baseURL?.toString() ??
    "http://localhost:8080";

  const timeoutMs = Number.parseInt(
    process.env.E2E_STACK_READY_TIMEOUT_MS ??
      String(DEFAULT_STACK_READY_TIMEOUT_MS),
    10,
  );

  if (Number.isNaN(timeoutMs) || timeoutMs < MIN_TIMEOUT_MS) {
    throw new Error(
      `Invalid E2E_STACK_READY_TIMEOUT_MS value: '${process.env.E2E_STACK_READY_TIMEOUT_MS}'.`,
    );
  }

  const rcwHealthUrl = new URL("/health", configuredBaseUrl).toString();

  const ccqHealthUrl =
    process.env.E2E_CCQ_HEALTH_URL ??
    new URL("/eligibility/health", configuredBaseUrl).toString();

  await pollUntilReady({
    isReady: (status) => status === HTTP_OK,
    name: "RCW health",
    timeoutMs,
    url: rcwHealthUrl,
  });

  // In local compose, nginx forwards /eligibility/* to CCQ.
  // /eligibility/health may return 404 when CCQ route prefixing is active,
  // but that still confirms the CCQ app is reachable (502 indicates upstream down).
  await pollUntilReady({
    isReady: (status) => status === HTTP_OK || status === HTTP_NOT_FOUND,
    name: "CCQ health",
    timeoutMs,
    url: ccqHealthUrl,
  });
}
