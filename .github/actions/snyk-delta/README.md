# Snyk Delta Composite

This action compares RCW Open Source and every required Container result with
the latest monitored snapshots for the explicitly configured Snyk projects. It
does not publish or refresh baselines.

## Verified Tooling

- Snyk CLI `1.1308.0`, installed by the official Snyk setup action pinned to
  `snyk/actions@aa6e70d07856828c0902d53c649eb82dea5e04be`.
- Snyk Delta `1.14.0`, installed at that exact npm version.
- Shared OAuth authentication pinned to
  `laa-reusable-github-actions@6db001458db30ae747d9eb8eb25707ce52b359bc`.
- Open Source uses `--dev`, high severity, the repository `.snyk` policy and
  explicit `--type vuln` delta filtering.
- Container uses the immutable image digest, Dockerfile, high severity and the
  repository `.snyk` policy. The CLI result is an array. Its `scanResult.identity`
  fields distinguish the Alpine OS result from target-file application results.
  The `apk` result also carries `docker.baseImage` and its OS/base-image paths.

Delta 1.14.0 reads each explicit monitored project and compares issue IDs and
dependency paths. Version-only changes on the same package-name path pass.
`--type vuln` excludes license issues. Exit 1 means a qualifying regression;
exit 2 means the comparison failed. A Snyk scan exit 1 is handled separately as
findings and does not bypass comparison.

## GitHub Variables

Configure these repository or environment variables, then pass them as the
corresponding action inputs:

- `SNYK_ORG_ID`: Snyk organization UUID.
- `SNYK_OPEN_SOURCE_PROJECT_ID`: monitored Open Source project UUID.
- `SNYK_CONTAINER_PROJECTS_JSON`: JSON array with one entry per required
  Container result. `identityType` and `targetFile` must match the CLI result
  exactly. The Alpine OS result has an empty target file; application results
  use their reported target file. Each entry names its own monitored project ID.

Example shape, using non-live identifiers:

```json
[
  {
    "identityType": "apk",
    "targetFile": "",
    "projectId": "22222222-2222-4222-8222-222222222222"
  },
  {
    "identityType": "npm",
    "targetFile": "/package.json",
    "projectId": "33333333-3333-4333-8333-333333333333"
  }
]
```

Do not infer monitored projects from names or array order. Derive and review
these entries from the selected CLI's result for the built image. The action
requires both the OS/base-image result and an application target-file result,
and fails on missing, duplicate or unmatched mappings.

Pass the OAuth client credentials through the existing `SNYK_CLIENT_ID` and
`SNYK_CLIENT_SECRET` repository secrets. Callers supply the immutable image
digest and Dockerfile path.

## Local Checks

Run the public action harness and pinned-tool compatibility checks with:

```sh
node --test .github/actions/snyk-delta/test.mjs .github/actions/snyk-delta/compatibility.mjs
```

The compatibility check runs the real Delta 1.14.0 module with sanitized
Container-shaped results and a stub at the baseline API boundary. It does not
verify hosted credentials, live projects or a real image scan.

## Hosted Acceptance Still Required

- Confirm the configured project UUIDs identify the intended Open Source,
  Alpine OS/base-image and application dependency projects.
- Confirm the OAuth identity can read every latest monitored baseline, including
  when a current scan is clean.
- Run `snyk container test` against the actual immutable CI image and verify all
  returned identities map exactly once, including OS/base-image and application
  results.
- Confirm high/critical regressions fail and comparison/API failures fail in the
  hosted runner. Do not treat successful baseline monitoring as remediation.
