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
report_file=
for arg in "$@"; do
  case "$arg" in
    --sarif-file-output=*) report_file=${arg#*=} ;;
  esac
done
if [[ -n "$report_file" ]]; then
  mkdir -p "$(dirname "$report_file")"
  scan=${report_file##*/}
  scan=${scan#snyk-}
  scan=${scan%.sarif}
  scan_exit=$SNYK_TEST_EXIT
  if [[ ",${SNYK_EMPTY_SCANS:-}," == *",$scan,"* || "$SNYK_TEST_EXIT" == "0" ]]; then
    jq -n '{runs:[{tool:{driver:{rules:[]}},results:[]}]}' > "$report_file"
    scan_exit=0
  else
    case "$scan" in
      open-source)
        rule_id=SNYK-JS-ZOD-20510278
        title='High severity - Unsafe input validation in zod'
        description='Crafted input bypasses validation in zod.'
        level=error
        score=7.5
        path=package.json
        ;;
      container)
        rule_id=SNYK-LINUX-BZIP2-106947
        title='Critical severity - Vulnerability in bzip2'
        description='The image contains a vulnerable bzip2 package.'
        level=error
        score=9.8
        path=Dockerfile
        ;;
      code)
        rule_id=javascript/NoSQLInjection
        title='NoSQL injection'
        description='Untrusted input reaches a database query.'
        level=warning
        score=
        path=src/query.ts
        ;;
      iac)
        rule_id=SNYK-CC-K8S-123
        title='Low severity - Publicly accessible resource'
        description='The resource permits public access.'
        level=note
        score=
        path=deploy/main.yaml
        ;;
    esac
    jq -n \
      --arg id "$rule_id" \
      --arg title "$title" \
      --arg description "$description" \
      --arg level "$level" \
      --arg score "$score" \
      --arg path "$path" \
      '{runs:[{tool:{driver:{rules:[{id:$id,shortDescription:{text:$title},properties:(if $score == "" then {} else {"security-severity":$score} end)}]}},results:[{ruleId:$id,level:$level,message:{text:$description},locations:[{physicalLocation:{artifactLocation:{uri:$path},region:{startLine:12}}}]}]}]}' \
      > "$report_file"
  fi
fi
if [[ "$1" == "test" ]]; then
  if [[ "$SCAN_MODE" == "delta" ]]; then
    printf '{"ok":true}\n'
  fi
  exit "$SNYK_TEST_EXIT"
fi
if [[ "$1" == "container" && "${2:-}" == "monitor" ]]; then
  exit "$SNYK_CONTAINER_MONITOR_EXIT"
fi
if [[ "$1" == "monitor" ]]; then
  exit "$SNYK_MONITOR_EXIT"
fi
if [[ -n "$report_file" ]]; then
  exit "$scan_exit"
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
  local snyk_org_id=${5-test-org-id}
  local fail_on_findings=${6:-false}
  local report_to_snyk=${7:-false}
  local empty_scans=${8:-}
  local container_monitor_exit=${9:-0}
  local image_uri=registry.example/app@sha256:$(printf 'a%.0s' {1..64})

  if [[ "$scan_mode" == "monitor" ]]; then
    image_uri=
  fi

  : > "$tmp_dir/calls.log"
  env \
    PATH="$tmp_dir/bin:$PATH" \
    SCAN_MODE="$scan_mode" \
    FAIL_ON_FINDINGS="$fail_on_findings" \
    SOURCE_SHA=0123456789012345678901234567890123456789 \
    IMAGE_URI="$image_uri" \
    IMAGE_REFERENCE=registry.example/app \
    REPORT_TO_SNYK="$report_to_snyk" \
    SNYK_TOKEN=test-token \
    SNYK_ORG_ID="$snyk_org_id" \
    SNYK_CALL_LOG="$tmp_dir/calls.log" \
    SNYK_TEST_EXIT="$snyk_test_exit" \
    SNYK_EMPTY_SCANS="$empty_scans" \
    GITHUB_SERVER_URL=https://github.com \
    GITHUB_REPOSITORY=ministryofjustice/laa-record-controlled-work \
    GITHUB_RUN_ID=123456789 \
    GITHUB_RUN_ATTEMPT=1 \
    SNYK_DELTA_EXIT="$delta_exit" \
    SNYK_MONITOR_EXIT="$monitor_exit" \
    SNYK_CONTAINER_MONITOR_EXIT="$container_monitor_exit" \
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
if grep -Fq '## Findings' "$tmp_dir/summary.md"; then
  echo 'Delta scans should not report an empty SARIF findings list' >&2
  exit 1
fi
assert_logged 'snyk test --org=test-org-id --project-name=laa-record-controlled-work-open-source --target-reference=main --dev --severity-threshold=high --json --print-deps'
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

if run_case delta 1 0 0 ''; then
  echo 'Delta mode should require an explicit Snyk organization' >&2
  exit 1
fi
if ! grep -Fq 'SNYK_ORG_ID is required' "$tmp_dir/output.log"; then
  echo 'The missing organization should be reported clearly' >&2
  exit 1
fi

if ! run_case absolute 1 0; then
  cat "$tmp_dir/output.log" >&2
  echo 'Absolute scans should report findings without failing by default' >&2
  exit 1
fi
assert_logged 'snyk test --all-projects --dev --severity-threshold=high --sarif-file-output='
setup_section=$(sed -n '/^## Setup checks$/,/^## Snyk scan results$/p' "$tmp_dir/summary.md")
scan_section=$(sed -n '/^## Snyk scan results$/,/^## Validation$/p' "$tmp_dir/summary.md")
validation_section=$(sed -n '/^## Validation$/,/^## Findings$/p' "$tmp_dir/summary.md")
if ! grep -Fq '| Node and dependency setup | passed |' <<< "$setup_section" ||
  grep -Fq '| Node and dependency setup | passed |' <<< "$scan_section"; then
  echo 'Setup checks should appear outside the Snyk scan results' >&2
  exit 1
fi
if ! grep -Fq '| Open Source | findings |' <<< "$scan_section"; then
  echo 'Snyk scan results should appear in their own section' >&2
  exit 1
fi
if ! grep -Fq '| Helm rendering | passed |' <<< "$validation_section"; then
  echo 'Helm rendering should appear under validation, not as a Snyk scan' >&2
  exit 1
fi
for finding in \
  '### Open Source findings' \
  '### Container findings' \
  '### Code findings' \
  '### IaC findings'; do
  if ! grep -Fq -- "$finding" "$tmp_dir/reports/findings.md"; then
    printf 'Expected findings section not found: %s\n' "$finding" >&2
    cat "$tmp_dir/output.log" >&2
    cat "$tmp_dir/reports/findings.md" >&2
    exit 1
  fi
  if ! grep -Fq -- "$finding" "$tmp_dir/summary.md"; then
    printf 'Expected findings section missing from workflow summary: %s\n' "$finding" >&2
    exit 1
  fi
done
for finding in \
  '[SNYK-JS-ZOD-20510278](https://security.snyk.io/vuln/SNYK-JS-ZOD-20510278) (High): Crafted input bypasses validation in zod. (package.json:12)' \
  '[SNYK-LINUX-BZIP2-106947](https://security.snyk.io/vuln/SNYK-LINUX-BZIP2-106947) (Critical): The image contains a vulnerable bzip2 package. (Dockerfile:12)' \
  'javascript/NoSQLInjection (Medium): Untrusted input reaches a database query. (src/query.ts:12)' \
  '[SNYK-CC-K8S-123](https://security.snyk.io/vuln/SNYK-CC-K8S-123) (Low): The resource permits public access. (deploy/main.yaml:12)'; do
  if ! grep -Fq -- "$finding" "$tmp_dir/reports/findings.md" ||
    ! grep -Fq -- "$finding" "$tmp_dir/summary.md"; then
    printf 'Expected markdown finding missing: %s\n' "$finding" >&2
    exit 1
  fi
done
for finding in \
  '<https://security.snyk.io/vuln/SNYK-JS-ZOD-20510278|SNYK-JS-ZOD-20510278> (High): Crafted input bypasses validation in zod. (package.json:12)' \
  '<https://security.snyk.io/vuln/SNYK-LINUX-BZIP2-106947|SNYK-LINUX-BZIP2-106947> (Critical): The image contains a vulnerable bzip2 package. (Dockerfile:12)' \
  'javascript/NoSQLInjection (Medium): Untrusted input reaches a database query. (src/query.ts:12)' \
  '<https://security.snyk.io/vuln/SNYK-CC-K8S-123|SNYK-CC-K8S-123> (Low): The resource permits public access. (deploy/main.yaml:12)'; do
  if ! grep -Fq -- "$finding" "$tmp_dir/reports/findings.txt"; then
    printf 'Expected Slack finding missing: %s\n' "$finding" >&2
    exit 1
  fi
done

if [[ "${SHOW_SUMMARY:-false}" == "true" ]]; then
  printf '\n--- Generated workflow summary (mock findings) ---\n'
  cat "$tmp_dir/summary.md"
  printf '%s\n' '--- End summary ---'
fi

if ! run_case absolute 1 0 0 test-org-id false false 'container,code'; then
  cat "$tmp_dir/output.log" >&2
  echo 'Partial scan findings should still produce a report' >&2
  exit 1
fi
for category in 'Open Source' IaC; do
  if ! grep -Fq "### $category findings" "$tmp_dir/summary.md"; then
    printf 'Expected non-empty scan section missing: %s\n' "$category" >&2
    exit 1
  fi
done
for category in Container Code; do
  if grep -Fq "### $category findings" "$tmp_dir/summary.md" ||
    grep -Fq "*$category findings*" "$tmp_dir/reports/findings.txt"; then
    printf 'Empty scan section should be omitted: %s\n' "$category" >&2
    exit 1
  fi
done

if ! run_case absolute 0 0 0 test-org-id false true; then
  cat "$tmp_dir/output.log" >&2
  echo 'Snyk reporting should allow absolute scans to complete' >&2
  exit 1
fi
if ! grep -Fq 'No findings.' "$tmp_dir/reports/findings.md" ||
  grep -Eq '^### (Open Source|Container|Code|IaC) findings$' "$tmp_dir/reports/findings.md"; then
  echo 'Successful clean scans should not create findings sections' >&2
  exit 1
fi
if run_case absolute 0 0 0 test-org-id false true '' 1; then
  echo 'A failed Container monitor write with exit code 1 should fail the workflow' >&2
  exit 1
fi
if ! grep -Fq 'Snyk Container monitoring failed with exit code 1' "$tmp_dir/output.log" ||
  ! grep -Fq '| Container monitoring | tool error (1) |' "$tmp_dir/summary.md" ||
  grep -Fq '| Container monitoring | findings |' "$tmp_dir/summary.md"; then
  echo 'Container monitor failures should be reported as operational errors' >&2
  exit 1
fi
assert_logged 'snyk code test --severity-threshold=high --report --project-name=laa-record-controlled-work-code --target-reference=main --sarif-file-output='
assert_logged '--severity-threshold=high --report --target-name=laa-record-controlled-work-iac --target-reference=main --sarif-file-output='

if run_case absolute 1 0 0 test-org-id true; then
  echo 'High findings should fail when strict findings are enabled' >&2
  exit 1
fi

if ! run_case monitor 0 0; then
  cat "$tmp_dir/output.log" >&2
  echo 'Baseline monitoring should pass without an image' >&2
  exit 1
fi
assert_logged 'snyk monitor --org=test-org-id --dev --project-name=laa-record-controlled-work-open-source --target-reference=main'
if grep -Fq 'container test' "$tmp_dir/calls.log"; then
  echo 'Monitor mode should run only the Open Source monitor' >&2
  exit 1
fi
if run_case monitor 0 0 1; then
  cat "$tmp_dir/output.log" >&2
  echo 'A failed monitoring write with exit code 1 should fail the workflow' >&2
  exit 1
fi
if ! grep -Fq 'Snyk Open Source monitoring failed with exit code 1' "$tmp_dir/output.log"; then
  echo 'The monitoring failure should be reported as an operational error' >&2
  exit 1
fi
if ! grep -Fq '| Open Source monitoring | tool error (1) |' "$tmp_dir/summary.md" ||
  grep -Fq '| Open Source monitoring | findings |' "$tmp_dir/summary.md"; then
  echo 'A failed OSS monitor write should not be summarized as vulnerability findings' >&2
  exit 1
fi
if run_case monitor 0 0 2; then
  echo 'A failed baseline update should fail the workflow' >&2
  exit 1
fi

if ! grep -Fq 'Snyk Open Source monitoring failed with exit code 2' "$tmp_dir/output.log"; then
  echo 'The monitoring failure should identify the operational exit code' >&2
  exit 1
fi
node --test "$repo_root/.github/scripts/test-format-snyk-findings.mjs"

echo 'Snyk scan mode checks passed'