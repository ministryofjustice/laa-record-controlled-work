#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
probe_script="$repo_root/.github/scripts/ecr-sbom-referrer-probe.sh"

run_rejected_probe() {
  local expected_error="$1"
  local registry="$2"
  local repository="$3"
  local output

  if output=$(env \
    ECR_REGISTRY_URL="$registry" \
    ECR_REPOSITORY="$repository" \
    AWS_REGION=eu-west-2 \
    GITHUB_RUN_ID=12345 \
    GITHUB_RUN_ATTEMPT=1 \
    GITHUB_STEP_SUMMARY=/tmp/rcw-ecr-probe-test-summary \
    bash "$probe_script" 2>&1); then
    printf 'Expected probe rejection: %s\n' "$expected_error" >&2
    exit 1
  fi

  if ! grep -Fq "$expected_error" <<< "$output"; then
    printf 'Expected error not found: %s\n%s\n' "$expected_error" "$output" >&2
    exit 1
  fi
}

run_rejected_probe \
  'Invalid ECR registry URL' \
  'https://attacker.example' \
  'laa-record-controlled-work/laa-record-controlled-work-uat'

run_rejected_probe \
  'Invalid ECR repository' \
  '000000000000.dkr.ecr.eu-west-2.amazonaws.com' \
  'laa-record-controlled-work;other'

printf 'ECR SBOM probe input tests passed\n'