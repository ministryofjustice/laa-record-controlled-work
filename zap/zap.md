# ZAP Security Scanning

[OWASP ZAP](https://www.zaproxy.org/) is the application's dynamic application security testing (DAST) tool. It scans the running Record Controlled Work stack, using traffic recorded from the e2e test suite as authenticated seed traffic.

## Running a scan locally

Start the full Docker Compose stack in one terminal:

```sh
make docker-up
```

Then, in another terminal, run:

```sh
make zap
```

`make zap` calls `yarn security:zap`, which runs [run-local.sh](run-local.sh). The script checks that the `nginx` service is already running, records HAR files from the full e2e suite, merges them, runs ZAP, and opens the HTML report.

The local scan uses the `zap-scan` service defined in [docker/compose/zap.yml](../docker/compose/zap.yml). It maps `localhost` to the `nginx` container, enabling the plan to scan `http://localhost:8080`, and maps `host.docker.internal` to the Docker host for the mock OAuth2 service.

## Scan flow

1. Every `@e2e` Playwright test runs against the full stack (locally via [run-local.sh](run-local.sh), in CI as part of the e2e workflow's own test run).
2. [tests/e2e/playwright.harness.ts](../tests/e2e/playwright.harness.ts) enables Playwright `recordHar` when `E2E_ZAP_HAR_DIRECTORY` is set. Every browser context writes a separate HAR, including contexts created by serial e2e suites.
3. [merge-hars.ts](merge-hars.ts) reads the individual HARs, then calls [har.ts](har.ts) to merge valid entries into `zap-results/e2e-suite.har`. Aborted requests with HTTP status `0` are omitted because ZAP cannot import them.
4. [zap.yaml](zap.yaml) imports the combined HAR, spiders from the application root for up to five minutes, then actively scans for up to five minutes.
5. ZAP waits for passive scanning to finish and produces a JSON summary plus HTML and JSON reports.

The OAuth callback URL is excluded from the ZAP context because it contains one-time authorisation values and should not be crawled again.

ZAP's spider and active scan crawl the live app, not just the imported HAR, so the stack must still be running when they execute. That's why the CI scan runs as the final steps of the existing e2e job instead of a separate workflow, which would have to start its own stack a second time.

## Files

| File | Responsibility |
| --- | --- |
| [zap.yaml](zap.yaml) | ZAP Automation Framework plan: target context, excluded paths, HAR import, scan limits, summary, and reports. |
| [run-local.sh](run-local.sh) | Local orchestration. Requires a running stack, runs e2e tests, merges HARs, runs ZAP, and opens the report. |
| [run-cicd.sh](run-cicd.sh) | CI orchestration. Merges the HARs already recorded by the e2e job's test run, pulls the ZAP image, then launches ZAP with host networking. |
| [merge-hars.ts](merge-hars.ts) | Command-line wrapper that reads individual HAR files from a directory and merges them. |
| [har.ts](har.ts) | Creates collision-resistant HAR paths and merges valid HAR entries. |
| [tests/e2e/playwright.harness.ts](../tests/e2e/playwright.harness.ts) | Records a HAR for every e2e browser context when a ZAP scan is requested. |
| [tests/unit/zap/har.spec.ts](../tests/unit/zap/har.spec.ts) | Verifies HAR path generation and merging behaviour. |
| [docker/compose/zap.yml](../docker/compose/zap.yml) | Local-only Compose service that mounts the plan and result directory. |
| [.github/workflows/e2e.yml](../.github/workflows/e2e.yml) | Runs the e2e suite, then (on pull requests) merges the recorded HARs, runs the ZAP scan against the same still-running stack, and uploads its reports. |

## Results and CI behaviour

Generated files are placed in `zap-results/`:

| File | Contents |
| --- | --- |
| `hars/` | Individual HAR files, one per e2e browser context. |
| `e2e-suite.har` | The merged e2e traffic imported by ZAP. |
| `zap-baseline-report.html` | Human-readable report; opened automatically after a local scan. |
| `zap-baseline-report.json` | JSON version of the report. |
| `zap_out.json` | ZAP Automation Framework output summary. |

The scan runs as part of the `.github/workflows/e2e.yml` job, gated to pull requests only. It reuses the stack and HARs from that job's e2e test run, then uploads the reports, merged HAR, and individual HARs as the `zap-scan-reports` artifact for 14 days. Upload and teardown run even when the scan fails.

The plan fails on ZAP errors, but reported warnings and alerts do not fail the scan. Review the HTML report and `zap_out.json` to decide whether a finding is expected, accepted, or needs remediation.

## Troubleshooting

- **The local script says the stack is not running:** start it with `make docker-up`, wait for readiness, then run `make zap`.
- **No HAR files are written:** run the e2e suite with recording enabled:

  ```sh
  E2E_ZAP_HAR_DIRECTORY="$PWD/zap-results/hars" yarn test:e2e
  ```

- **The combined HAR cannot be imported:** inspect the individual files in `zap-results/hars/`. [har.ts](har.ts) removes aborted entries with status `0` during merging.
- **The scan cannot reach the application or mock OAuth2 service:** check Docker host mappings in [docker/compose/zap.yml](../docker/compose/zap.yml).


## Changing coverage

New `@e2e` tests automatically contribute their browser-context traffic to the ZAP scan. Test suites that create contexts through `createBrowserContext()` in [tests/e2e/playwright.harness.ts](../tests/e2e/playwright.harness.ts) are recorded too. Update [zap.yaml](zap.yaml) only when changing the scan target, exclusions, job configuration, reports, or time limits.