#!/usr/bin/env bash
set -uo pipefail

source_sha=${SOURCE_SHA:-}
image_uri=${IMAGE_URI:-}
image_reference=${IMAGE_REFERENCE:-}
scan_mode=${SCAN_MODE:-absolute}
report_to_snyk=${REPORT_TO_SNYK:-false}
findings_are_errors=${FAIL_ON_FINDINGS:-false}
report_dir=${SNYK_REPORT_DIR:-sarif}
render_dir=${SNYK_RENDER_DIR:-rendered-templates}
summary_path=${GITHUB_STEP_SUMMARY:-}
overall_status=0

is_delta_scan() {
  [[ "$scan_mode" == "delta" ]]
}

is_absolute_scan() {
  [[ "$scan_mode" == "absolute" ]]
}

is_monitor_scan() {
  [[ "$scan_mode" == "monitor" ]]
}

is_supported_scan_mode() {
  is_delta_scan || is_absolute_scan || is_monitor_scan
}

requires_snyk_org() {
  is_delta_scan || is_monitor_scan
}

runs_full_scan_set() {
  ! is_monitor_scan
}

has_full_source_sha() {
  [[ "$source_sha" =~ ^[0-9a-fA-F]{40}$ ]]
}

has_immutable_image_uri() {
  [[ "$image_uri" =~ ^[^[:space:]@]+@sha256:[a-f0-9]{64}$ ]]
}

is_boolean_value() {
  [[ "$1" == "true" || "$1" == "false" ]]
}

has_summary() {
  [[ -n "$summary_path" ]]
}

if ! has_full_source_sha; then
  echo "::error::source_sha must be a full commit SHA"
  exit 1
fi

if ! is_supported_scan_mode; then
  echo "::error::SCAN_MODE must be delta, absolute, or monitor"
  exit 1
fi

if is_delta_scan && [[ -z "${SNYK_TOKEN:-}" ]]; then
  echo "::error::SNYK_TOKEN is required for Snyk Delta"
  exit 1
fi

if requires_snyk_org && [[ -z "${SNYK_ORG_ID:-}" ]]; then
  echo "::error::SNYK_ORG_ID is required for Snyk Delta and monitoring"
  exit 1
fi

if runs_full_scan_set && ! has_immutable_image_uri; then
  echo "::error::image_uri must reference an immutable sha256 digest"
  exit 1
fi

if ! is_boolean_value "$report_to_snyk"; then
  echo "::error::REPORT_TO_SNYK must be true or false"
  exit 1
fi

if ! is_boolean_value "$findings_are_errors"; then
  echo "::error::FAIL_ON_FINDINGS must be true or false"
  exit 1
fi

mkdir -p "$report_dir" "$render_dir"

run_url="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}/attempts/${GITHUB_RUN_ATTEMPT:-1}"
if has_summary; then
  {
    echo "## Snyk security gate"
    echo
    echo "- Source SHA: $source_sha"
    echo "- Image: $image_reference"
    echo "- Run: [${GITHUB_RUN_ID:-unknown}]($run_url)"
    echo
    echo "## Setup checks"
    echo
    echo "| Check | Result |"
    echo "| --- | --- |"
  } > "$summary_path"
fi

record_status() {
  local name=$1
  local status=$2

  if has_summary; then
    printf '| %s | %s |\n' "$name" "$status" >> "$summary_path"
  fi

  if [[ "$status" != "passed" && "$status" != "findings" ]]; then
    overall_status=1
  fi
}

record_setup() {
  local name=$1
  local outcome=$2

  if [[ "$outcome" == "success" ]]; then
    record_status "$name" passed
  else
    echo "::error::$name failed; independent scans will still run"
    record_status "$name" "failed ($outcome)"
  fi
}

record_setup "Node and dependency setup" "${SETUP_NODE_OUTCOME:-success}"
if runs_full_scan_set; then
  record_setup "ECR credentials" "${ECR_AUTH_OUTCOME:-success}"
  record_setup "ECR login" "${ECR_LOGIN_OUTCOME:-success}"
  record_setup "Helm installation" "${HELM_SETUP_OUTCOME:-success}"
fi
record_setup "Snyk CLI installation" "${SNYK_CLI_INSTALL_OUTCOME:-success}"
if is_delta_scan; then
  record_setup "Snyk Delta installation" "${SNYK_DELTA_INSTALL_OUTCOME:-success}"
fi
record_setup "Snyk OAuth action" "${SNYK_AUTH_OUTCOME:-success}"
record_setup "Snyk OAuth token masking" "${SNYK_TOKEN_MASK_OUTCOME:-success}"

if has_summary; then
  {
    echo
    echo "## Snyk scan results"
    echo
    echo "| Scan | Result |"
    echo "| --- | --- |"
  } >> "$summary_path"
fi

policy_args=()
if [[ -f .snyk ]]; then
  policy_args+=(--policy-path=.snyk)
fi

is_monitor_operation() {
  local command=${1:-}
  local subcommand=${2:-}
  local operation=${3:-}

  case "$command:$subcommand:$operation" in
    snyk:monitor:*|snyk:container:monitor) return 0 ;;
    *) return 1 ;;
  esac
}

is_findings_exit() {
  [[ "$1" == "1" && "$2" != "true" ]]
}

run_scan() {
  local name=$1
  shift
  local exit_code
  local monitor_operation=false

  if is_monitor_operation "$@"; then
    monitor_operation=true
  fi

  echo "::group::Snyk $name"
  if "$@"; then
    exit_code=0
  else
    exit_code=$?
  fi
  echo "::endgroup::"

  if [[ "$exit_code" == "0" ]]; then
    record_status "$name" passed
  elif is_findings_exit "$exit_code" "$monitor_operation"; then
    if [[ "$findings_are_errors" == "true" ]]; then
      echo "::error::Snyk $name found high-severity findings"
      overall_status=1
    else
      echo "::warning::Snyk $name found high-severity findings"
    fi
    record_status "$name" findings
  else
    echo "::error::Snyk $name failed with exit code $exit_code"
    record_status "$name" "tool error ($exit_code)"
  fi
}

has_missing_delta_baseline() {
  grep -Fq 'Could not find a matching monitored Snyk project.' "$1"
}

run_delta_scan() {
  local snyk_status
  local delta_status
  local output_status
  local delta_output="$report_dir/snyk-open-source-delta.log"
  local -a pipeline_status

  echo "::group::Snyk Open Source Delta"
  : > "$delta_output"
  snyk test --org="$SNYK_ORG_ID" \
    --project-name=laa-record-controlled-work-open-source \
    --target-reference=main \
    --dev --severity-threshold=high --json --print-deps "${policy_args[@]}" \
    | snyk-delta --targetReference main --type vuln 2>&1 \
    | tee "$delta_output"
  pipeline_status=("${PIPESTATUS[@]}")
  echo "::endgroup::"

  snyk_status=${pipeline_status[0]}
  delta_status=${pipeline_status[1]}
  output_status=${pipeline_status[2]}
  if has_missing_delta_baseline "$delta_output"; then
    echo "::error::Snyk Delta could not find the monitored main Open Source baseline"
    record_status "Open Source Delta" "baseline unavailable"
  elif (( output_status != 0 )); then
    echo "::error::Failed to preserve Snyk Delta comparison output"
    record_status "Open Source Delta" "report error ($output_status)"
  elif (( snyk_status > 1 )); then
    echo "::error::Snyk Open Source test failed with exit code $snyk_status"
    record_status "Open Source Delta" "tool error ($snyk_status)"
  elif (( delta_status == 0 )); then
    record_status "Open Source Delta" passed
  elif (( delta_status == 1 )); then
    echo "::error::Snyk Delta found new high or critical findings"
    overall_status=1
    record_status "Open Source Delta" findings
  else
    echo "::error::Snyk Delta failed with exit code $delta_status"
    record_status "Open Source Delta" "tool error ($delta_status)"
  fi
}

if is_monitor_scan; then
  run_scan "Open Source monitoring" snyk monitor \
    --org="$SNYK_ORG_ID" --dev \
    --project-name=laa-record-controlled-work-open-source \
    --target-reference=main "${policy_args[@]}"
else
  if is_delta_scan; then
    run_delta_scan
  else
    run_scan "Open Source" snyk test --all-projects --dev \
      --severity-threshold=high \
      --sarif-file-output="$report_dir/snyk-open-source.sarif" "${policy_args[@]}"
  fi

  run_scan "Container" snyk container test "$image_uri" \
    --file=Dockerfile --severity-threshold=high \
    --sarif-file-output="$report_dir/snyk-container.sarif" "${policy_args[@]}"

  if [[ "$report_to_snyk" == "true" ]]; then
    run_scan "Container monitoring" snyk container monitor "$image_uri" \
      --file=Dockerfile \
      --project-name=laa-record-controlled-work-container \
      --target-reference=main "${policy_args[@]}"
  fi

  code_args=(--severity-threshold=high)
  if [[ "$report_to_snyk" == "true" ]]; then
    code_args+=(--report \
      --project-name=laa-record-controlled-work-code --target-reference=main)
  fi
  code_args+=(--sarif-file-output="$report_dir/snyk-code.sarif")
  run_scan "Code" snyk code test "${code_args[@]}"

  render_status=passed
  for environment in uat staging production; do
    if helm template deploy/laa-record-controlled-work \
      -f "deploy/laa-record-controlled-work/values/${environment}.yaml" \
      > "$render_dir/${environment}.yaml"; then
      echo "Rendered $environment manifests"
    else
      echo "::error::Failed to render $environment manifests"
      rm -f "$render_dir/${environment}.yaml"
      render_status=failed
      overall_status=1
    fi
  done

  iac_args=("$render_dir" --severity-threshold=high)
  if [[ "$report_to_snyk" == "true" ]]; then
    iac_args+=(--report \
      --target-name=laa-record-controlled-work-iac --target-reference=main)
  fi
  iac_args+=(--sarif-file-output="$report_dir/snyk-iac.sarif" "${policy_args[@]}")
  run_scan "IaC" snyk iac test "${iac_args[@]}"
fi

if runs_full_scan_set && has_summary; then
  {
    echo
    echo "## Validation"
    echo
    echo "| Check | Result |"
    echo "| --- | --- |"
    printf '| Helm rendering | %s |\n' "$render_status"
  } >> "$summary_path"
fi

if is_absolute_scan; then
  if ! node .github/scripts/format-snyk-findings.mjs "$report_dir"; then
    echo "::error::Failed to format findings from Snyk SARIF reports"
    overall_status=1
  fi
  markdown_findings_path="$report_dir/findings.md"
  if has_summary && [[ -f "$markdown_findings_path" ]]; then
    echo >> "$summary_path"
    echo "## Findings" >> "$summary_path"
    cat "$markdown_findings_path" >> "$summary_path"
  fi
fi

if has_summary; then
  echo >> "$summary_path"
  echo "Reports and rendered templates are attached to the [workflow run]($run_url)." >> "$summary_path"
fi

exit "$overall_status"