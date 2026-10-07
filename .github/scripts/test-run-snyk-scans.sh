#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
script="$repo_root/.github/scripts/run-snyk-scans.sh"
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT
mkdir -p "$tmp_dir/bin"

cat > "$tmp_dir/bin/snyk" <<'MOCK'
#!/usr/bin/env bash
printf 'snyk %s\n' "$*" >> "$SNYK_CALL_LOG"
if [[ "$1" == "test" ]]; then
  if [[ "$SCAN_MODE" == "delta" ]]; then
    printf '{"ok":true}\n'
  fi
  exit "$SNYK_TEST_EXIT"
fi
if [[ "$1" == "monitor" ]]; then
  exit "$SNYK_MONITOR_EXIT"
fi
exit 0
MOCK

cat > "$tmp_dir/bin/snyk-delta" <<'MOCK'
#!/usr/bin/env bash
cat >/dev/null
printf 'snyk-delta %s\n' "$*" >> "$SNYK_CALL_LOG"
exit "$SNYK_DELTA_EXIT"
MOCK

cat > "$tmp_dir/bin/helm" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
chmod +x "$tmp_dir/bin/snyk" "$tmp_dir/bin/snyk-delta" "$tmp_dir/bin/helm"

run_case() {
  local scan_mode=$1
  local snyk_test_exit=$2
  local delta_exit=$3
  local monitor_exit=${4:-0}
  local image_uri=registry.example/app@sha256:$(printf 'a%.0s' {1..64})

  if [[ "$scan_mode" == "monitor" ]]; then
    image_uri=
  fi

  : > "$tmp_dir/calls.log"
  env \
    PATH="$tmp_dir/bin:$PATH" \
    SCAN_MODE="$scan_mode" \
    SOURCE_SHA=0123456789012345678901234567890123456789 \
    IMAGE_URI="$image_uri" \
    IMAGE_REFERENCE=registry.example/app \
    REPORT_TO_SNYK=false \
    SNYK_TOKEN=test-token \
    SNYK_CALL_LOG="$tmp_dir/calls.log" \
    SNYK_TEST_EXIT="$snyk_test_exit" \
    SNYK_DELTA_EXIT="$delta_exit" \
    SNYK_MONITOR_EXIT="$monitor_exit" \
    SNYK_REPORT_DIR="$tmp_dir/reports" \
    SNYK_RENDER_DIR="$tmp_dir/rendered" \
    GITHUB_STEP_SUMMARY="$tmp_dir/summary.md" \
    SETUP_NODE_OUTCOME=success \
    ECR_AUTH_OUTCOME=success \
    ECR_LOGIN_OUTCOME=success \
    HELM_SETUP_OUTCOME=success \
    SNYK_CLI_INSTALL_OUTCOME=success \
    SNYK_DELTA_INSTALL_OUTCOME=success \
    SNYK_AUTH_OUTCOME=success \
    SNYK_TOKEN_MASK_OUTCOME=success \
    bash "$script" > "$tmp_dir/output.log" 2>&1
}

assert_logged() {
  if ! grep -Fq -- "$1" "$tmp_dir/calls.log"; then
    printf 'Expected command not found: %s\n' "$1" >&2
    cat "$tmp_dir/calls.log" >&2
    exit 1
  fi
}

if ! run_case delta 1 0; then
  cat "$tmp_dir/output.log" >&2
  echo 'Existing high findings should pass when Delta finds no regression' >&2
  exit 1
fi
assert_logged 'snyk test --dev --severity-threshold=high --json --print-deps'
assert_logged 'snyk-delta --targetReference main'

if run_case delta 1 1; then
  echo 'A new high or critical finding should fail' >&2
  exit 1
fi
if ! grep -Fq 'Snyk Delta found new high or critical findings' "$tmp_dir/output.log"; then
  echo 'The failure should identify a high or critical Delta regression' >&2
  exit 1
fi

if run_case delta 1 2; then
  echo 'A Delta tool error should fail the workflow' >&2
  exit 1
fi
if ! grep -Fq 'Snyk Delta failed with exit code 2' "$tmp_dir/output.log"; then
  echo 'The failure should identify the Delta tool error' >&2
  exit 1
fi

if run_case absolute 1 0; then
  echo 'High findings should fail the absolute gate' >&2
  exit 1
fi
assert_logged 'snyk test --all-projects --dev --severity-threshold=high --sarif-file-output='

if ! run_case monitor 0 0; then
  cat "$tmp_dir/output.log" >&2
  echo 'Baseline monitoring should pass without an image' >&2
  exit 1
fi
assert_logged 'snyk monitor --dev'
if grep -Fq 'container test' "$tmp_dir/calls.log"; then
  echo 'Monitor mode should run only the Open Source monitor' >&2
  exit 1
fi
if run_case monitor 0 0 1; then
  echo 'A failed baseline update should fail the workflow' >&2
  exit 1
fi

echo 'Snyk scan mode checks passed'