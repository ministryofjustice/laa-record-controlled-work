# Deploy Workflow Summary

Triggers on push to any branch and can be triggered manually.

`code-linting` - ESLint checks 
`code-security-audit` - Yarn npm audit for vulnerabilities
`snyk` - Snyk Docker image security scan
`mocha-unit-tests` - Unit tests 
`playwright` - E2E/accessibility tests
`build-image` - Build & push Docker image to ECR
`deploy-uat` - Deploy to UAT environment when all above flows pass.

## Environment & Secrets

`SNYK_TOKEN` - In order to use snyk you need a api token which you can get by asking in #snyk channel
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
You need to acquire and add a snyk api token in your github secrets under SNYK_TOKEN you can request this in #snyk channel for a API key **DO NOT USE PERSONAL API TOKEN**
You need to add renovate application to you github repo you can request this via #ask-operations-engineering

# Snyk infra Workflow Summary

snyk iac action docs - https://github.com/snyk/actions/tree/master/iac

Triggers on weekly on 21:30 on Monday evening and can be triggered manually.

Synk iac action checks out your Infrastructure as Code Configuration files, and scans them for any security issues. The results are then uploaded to GitHub Security Code Scanning

## Other setup steps

Helm template files need to be rendered prior to scanning as they will fail to parse within the action.

```yml
run: |
    helm template deploy/laa-record-controlled-work \
    -f deploy/laa-record-controlled-work/values/uat.yaml \
    > rendered-values.yaml
```

The action autogenerates a sarif file to be uploaded to github under snyk.sarif which means when you scan different directories this will overwrite the previous sarif file to avoid this and  handle multiple different sarifs you set sarif to false and pass in the file output to be a customised name to avoid being overwritten

```yml
sarif: false
args: --sarif-file-output=snyk-deploy.sarif
```


