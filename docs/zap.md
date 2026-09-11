# ZAP Security Scanning

[OWASP ZAP](https://www.zaproxy.org/) is the application's dynamic application security testing (DAST) tool. It scans the running Record Controlled Work stack. The scan first captures an authenticated user journey using Playwright, imports that browser traffic into ZAP, then crawls and scans the reachable application.

## Running a scan locally

Start the full Docker Compose stack in one terminal:

```sh
make docker-up
```

Then, in another terminal, run:

```sh
make zap
```

`make zap` calls `yarn security:zap`, which runs [`scripts/zap/zap-run-local.sh`](../scripts/zap/zap-run-local.sh). The script checks that the `nginx` service is already running, creates `zap-results/`, records the ZAP journey, runs the ZAP container, and opens the HTML report when the scan finishes.

The local scan uses the `zap-scan` service defined in [`docker/compose/zap.yml`](../docker/compose/zap.yml). It shares the running Compose stack and maps `localhost` to the `nginx` container so that the plan can scan `http://localhost:8080`. It also maps `host.docker.internal` to the Docker host for the mock OAuth2 service.

## Scan flow

1. [`tests/e2e/specs/zap/create-case.spec.ts`](../tests/e2e/specs/zap/create-case.spec.ts) is selected with the `@zap` tag. It signs in with multiple offices, selects an office, and completes the shortest create-case path.
2. [`tests/e2e/playwright.harness.ts`](../tests/e2e/playwright.harness.ts) enables Playwright `recordHar` when `E2E_ZAP_HAR_PATH` is set. After the browser context closes, it removes aborted requests (HTTP status `0`) because ZAP rejects a HAR containing them.
3. The run script verifies that `zap-results/create-case.har` was produced.
4. [`zap.yaml`](../zap.yaml) imports that HAR into ZAP, providing authenticated, CSRF-valid traffic for the journey.
5. ZAP spiders from the application root for up to five minutes, then performs an active scan for up to five minutes. It waits for passive scanning to finish, writes a JSON summary, and generates HTML and JSON reports.

The callback URL is excluded from the ZAP context because an OAuth authorisation callback contains one-time values and should not be revisited by the crawler.

## Configuration and supporting files

| File | Responsibility |
| --- | --- |
| [`zap.yaml`](../zap.yaml) | ZAP Automation Framework plan: target context, excluded paths, HAR import, passive-scan settings, spider and active-scan limits, summary, and reports. |
| [`scripts/zap/zap-run-local.sh`](../scripts/zap/zap-run-local.sh) | Local orchestration. Requires a running stack, records the HAR, starts `zap-scan` with `--no-deps`, and opens the HTML report. |
| [`scripts/zap/zap-run-cicd.sh`](../scripts/zap/zap-run-cicd.sh) | CI orchestration. Records the same HAR, then runs `zaproxy/zap-stable` directly with host networking and ZAP listening on port `8090`. |
| [`docker/compose/zap.yml`](../docker/compose/zap.yml) | Local-only Compose service, mounts the plan and results directory, and supplies host mappings used by the scan. |
| [`tests/e2e/specs/zap/create-case.spec.ts`](../tests/e2e/specs/zap/create-case.spec.ts) | The deliberately scoped authenticated journey used to seed ZAP. |
| [`tests/e2e/playwright.harness.ts`](../tests/e2e/playwright.harness.ts) | HAR recording and invalid-entry filtering when a ZAP scan is requested. |
| [`.github/workflows/zap-scanning.yml`](../.github/workflows/zap-scanning.yml) | Reusable GitHub Actions workflow that starts the stack, runs the CI script, uploads results, and tears the stack down. |
| [`.github/workflows/cicd.yml`](../.github/workflows/cicd.yml) | Invokes the reusable ZAP workflow for pull requests. |

## Results and CI behaviour

Generated files are placed in `zap-results/`:

| File | Contents |
| --- | --- |
| `create-case.har` | The recorded authenticated Playwright journey imported by ZAP. |
| `zap-baseline-report.html` | Human-readable report; this is opened automatically after a local scan. |
| `zap-baseline-report.json` | Json version of the report. |
| `zap_out.json` | ZAP Automation Framework output summary. |

The CI workflow runs on pull requests through the `Security` job. It starts the full stack with `docker/compose/up --ci`, uses the same tagged Playwright journey, and uploads the four files above as the `zap-scan-reports` artifact for 14 days. It always uploads available results and tears down the stack, even when the scan fails.

The plan is configured to fail on errors, but reported warnings and alerts do not fail the scan. Review the HTML report and `zap_out.json` to determine whether each finding is expected, accepted, or needs remediation. 

## Troubleshooting

- **The local script says the stack is not running:** start it with `make docker-up`, wait for it to become ready, then rerun `make zap`.

- **The HAR is missing:** run the tagged Playwright test directly to inspect its failure:
