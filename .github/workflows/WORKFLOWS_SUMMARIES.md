# CICD Workflow Summary

Runs for pull requests, main pushes, merge groups, and manual dispatches.

`code-linting` - ESLint and Knip dependency checks.
`verify-api-code-generation` - Checks generated RCW API client code matches the OpenAPI specification.
`code-security-audit` - Runs `yarn npm audit`.
`snyk` - Runs the PR regression gate or absolute scans for manual non-main dispatches.
`mocha-tests` - Unit and integration tests.
`playwright` - Browser and accessibility tests.
`e2e` - End-to-end tests.
`build-image` - Builds and pushes the candidate image to ECR, then exposes its confirmed digest.
`deploy-uat` - Deploys to UAT after the required CI, scan, and test jobs pass.
`deploy-staging` - Deploys to staging after UAT succeeds on main.
`notify-main-ci-failure` - Sends a Slack notification when main CI jobs fail.

## Snyk Security Gates

`snyk` calls `.github/workflows/snyk.yml` for pull requests and merge groups.
Open Source uses `snyk-delta` against the configured main baseline; Container,
Code, and UAT/staging/production IaC run absolute assessments. `snyk-delta` is
pinned to `1.14.0`.

Main pushes call `.github/workflows/snyk-monitor.yml` independently of deploy
jobs. It scans Open Source, Container, Code, and each rendered IaC environment.
Open Source and Container use their monitor commands; Code and IaC use
`test --report`. Findings do not fail this refresh. Command, report, publication,
and required SARIF upload failures do. Each product and IaC environment uploads
to its own GitHub Security category.

The main publisher validates the current main SHA and the matching CI image
build. It compares the caller's digest with the digest stored under that SHA's
ECR tag. Manual dispatch is restricted to main and requires the CI run ID and
image digest from a successful `Build Docker Image` job for that source. The
workflow verifies the run, source SHA, build result, and ECR tag digest. It never
rebuilds or falls back to a floating tag. If the image is unavailable,
Container publication fails while valid Open Source, Code, IaC, and SARIF work
continues.

Set `SNYK_ORG_ID` and `SNYK_OPEN_SOURCE_PROJECT_ID` as repository Actions
variables. The workflow passes them to the composite action as `org-id` and
`open-source-project-id`. The main publisher verifies that the project UUID in
Snyk's monitor snapshot URL matches the configured Open Source baseline. The
CLI does not accept a project UUID selector, so a mismatch fails the refresh.
The OSS project is the only configured delta baseline; Container project UUID
mappings are not used.

The Snyk CLI is pinned to `1.1308.0`. Main refresh and nightly SARIF publication
share the non-cancelling `snyk-publication-${{ github.repository }}` queue.
Products publish independently, so partial failures can leave dashboards at
different main commits. The OSS delta baseline is the latest successful OSS
refresh and can lag the other product snapshots. Refreshes are not deployment
prerequisites. Main CI's generic failure notification still includes a failed
refresh.

## Nightly Snyk Gate

`.github/workflows/nightly.yml` runs at 06:00 UTC, after Renovate's
`before 5am Europe/London` merge window, and supports manual dispatch on main.
It resolves the existing main image by commit tag and calls `snyk.yml` in
absolute mode without building, deploying, or publishing Snyk dashboard
snapshots. Findings fail the scan and trigger the existing Snyk-specific Slack
alert. SARIF and formatted findings are retained by this legacy nightly path.
Its Snyk job shares the main publication queue. Nightly dashboard refresh and
reporting behavior remains to be migrated separately.

Fork provenance: `.github/workflows/sast.yml` from
`laa-reusable-github-actions@a7cbc9ed08d5ab503a21b24297b697797866dc14`,
adapted for the RCW four-scan and digest contract.

## Environment & Secrets

`SNYK_CLIENT_ID` and `SNYK_CLIENT_SECRET` - Snyk OAuth credentials used to obtain a short-lived scan token
`SNYK_ORG_ID` - Snyk organization ID used by Delta and baseline monitoring
`ECR_ROLE_TO_ASSUME`,`ECR_REGION`,`ECR_REGISTRY_URL`,`ECR_REPOSITORY`,`KUBE_NAMESPACE`,`KUBE_CLUSTER`,`KUBE_TOKEN`,`KUBE_CERT` - These are automated generated in github repo during namespace/container deployment set up see deployment readme

`environment: uat` - We are using env specific environment secrets and variables via our deployment script/values.ylm files and our github environment.


# SCA Workflow Summary

SCA docs - https://github.com/ministryofjustice/devsecops-actions/tree/main/sca#-features
DevSecOps actions docs - https://github.com/ministryofjustice/devsecops-actions?tab=readme-ov-file

Triggers on pushs and PR's to main. 

SCA is an action for software composition analysis, dependency management, and security review across the entire software supply chain. This action orchestrates 9 specialized security tools to provide complete visibility into your application's dependencies, vulnerabilities, and supply chain risks.

## Features

GitHub Dependency Review - PR-based vulnerability detection - GitHub Alerts
OWASP Dependency-Check - CVE detection with CVSS scorinn - SARIF, HTML, JSON
Renovate - Automated dependency updates - Pull Requests
MOJ Secret Scanner - Custom secret patterns	Log - Output
TruffleHog - Entropy + pattern secret detection - JSON
CodeQL - Static application security testing - SARIF
OpenSSF Scorecard - Repository security posture - JSON, Markdown
Syft - SBOM generation - CycloneDX JSON

## Hidden setup steps
Add the Snyk OAuth client ID and secret to GitHub repository secrets as `SNYK_CLIENT_ID` and `SNYK_CLIENT_SECRET`.
You need to add renovate application to you github repo you can request this via #ask-operations-engineering


