# CICD Workflow Summary

Runs for pull requests, main pushes, merge groups, and manual dispatches.

`code-linting` - ESLint and Knip dependency checks.
`verify-api-code-generation` - Checks generated RCW API client code matches the OpenAPI specification.
`code-security-audit` - Runs `yarn npm audit`.
`snyk` - Runs the shared Snyk Open Source, container, Code, and IaC scans.
`mocha-tests` - Unit and integration tests.
`playwright` - Browser and accessibility tests.
`e2e` - End-to-end tests.
`build-image` - Builds and pushes the candidate image to ECR, then exposes its confirmed digest.
`deploy-uat` - Deploys to UAT after the required CI, scan, and test jobs pass.
`deploy-staging` - Deploys to staging after UAT succeeds on main.
`notify-main-ci-failure` - Sends a Slack notification when main CI jobs fail.

## Snyk Security Gate

`snyk` calls `.github/workflows/snyk.yml`, the sole Snyk scan owner.
It checks Open Source including development dependencies, the pushed ECR image,
Snyk Code, and rendered UAT, staging, and production manifests.
The CLI is pinned to `1.1307.4`; high findings and scan errors fail the gate.
`build-image` exposes the digest returned by Docker push. CICD scans that
immutable image URI before deployment.

## Nightly Snyk Reporting

`.github/workflows/nightly.yml` runs at 06:00 UTC, after Renovate's
`before 5am Europe/London` merge window, and supports manual dispatch on main.
It resolves the existing main image by commit tag and calls `snyk.yml` without
building or deploying. PR scans remain GitHub SARIF checks and do not publish
Snyk snapshots. Nightly main runs publish Open Source, Container, Code and IaC
results to the Snyk organization using stable main project identities.
The OAuth identity must prefer the intended organization; Code reporting also
requires the `View Project Ignores` permission.

Fork provenance: `.github/workflows/sast.yml` from
`laa-reusable-github-actions@a7cbc9ed08d5ab503a21b24297b697797866dc14`,
adapted for the RCW four-scan and digest contract.

## Environment & Secrets

`SNYK_CLIENT_ID` and `SNYK_CLIENT_SECRET` - Snyk OAuth credentials used to obtain a short-lived scan token
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


