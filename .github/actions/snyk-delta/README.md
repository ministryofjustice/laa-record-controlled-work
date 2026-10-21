# Snyk Open Source Delta Composite

This action compares the Open Source scan with the latest monitored snapshot for
one explicitly configured Snyk project. It does not scan Containers, publish or
refresh baselines, or upload GitHub Security results.

## Verified Tooling

- Snyk CLI `1.1308.0`, installed by the official Snyk setup action pinned to
  `snyk/actions@aa6e70d07856828c0902d53c649eb82dea5e04be`.
- Snyk Delta `1.14.0`, installed at that exact npm version.
- Shared OAuth authentication pinned to
  `laa-reusable-github-actions@6db001458db30ae747d9eb8eb25707ce52b359bc`.
- Open Source scans include development dependencies, use high severity and
  apply the repository `.snyk` policy.

Before comparison, the action reads the project by its configured UUID and
validates that it belongs to the configured organization, is an active CLI
project, matches the scan's package manager, targets `main` and has a recorded
test date. This check runs even when the current scan is clean. Delta then reads
the same explicit project baseline. The compatibility check verifies the
lookup coordinates and uses sanitized Open Source CLI JSON with the pinned
Delta package. Delta compares issue IDs and dependency paths, so unchanged
findings and version-only changes on the same package-name path pass. New high
or critical findings and qualifying new paths fail. The explicit `--type vuln`
option excludes license findings.

A Snyk test exit code of 1 means findings and does not skip comparison. Other
scan errors, invalid or incomplete output, baseline-read errors and comparison
errors fail the action. Delta exit codes are 0 for no regression, 1 for a
regression and 2 for an operational error.

## GitHub Variables

Configure these repository or environment variables, then pass them as the
corresponding action inputs:

- `SNYK_ORG_ID`: Snyk organization UUID.
- `SNYK_OPEN_SOURCE_PROJECT_ID`: UUID of the intended monitored Open Source
  project in that organization.

Set the project UUID to the Open Source project refreshed by trusted-main
monitoring. The action does not discover a project by name or require the
snapshot to match the PR base commit. Main, nightly and their trusted manual
paths refresh the same monitored baseline. A lagging snapshot is not evidence
that its findings are fixed. The action rejects an inaccessible, inactive,
untested, non-CLI, non-main or package-manager-mismatched project.

Pass OAuth credentials through the existing `SNYK_CLIENT_ID` and
`SNYK_CLIENT_SECRET` repository secrets. Callers pass both variables and those
secrets to the action.

## Local Checks

Run the public action harness and pinned-tool compatibility checks with:

```sh
node --test .github/actions/snyk-delta/test.mjs .github/actions/snyk-delta/compatibility.mjs
```

The compatibility check runs the real Delta 1.14.0 module with sanitized OSS
results and a stub at the baseline API boundary. It does not verify hosted
credentials or live project configuration.

## Hosted Acceptance Still Required

- Confirm the configured project UUID identifies the intended monitored OSS
  project in the configured organization.
- Confirm the existing OAuth identity can read its latest monitored baseline,
  including when the current scan is clean.
- Confirm trusted-main monitoring uses development dependencies and the same
  `.snyk` policy as the delta scan.
- Confirm high/critical regressions fail and comparison/API failures fail in the
  hosted runner. Do not treat baseline lag as evidence of remediation.
