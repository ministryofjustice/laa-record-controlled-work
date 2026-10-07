#!/usr/bin/env bash
set -uo pipefail

source_sha=${SOURCE_SHA:-}
image_uri=${IMAGE_URI:-}
image_reference=${IMAGE_REFERENCE:-}
scan_mode=${SCAN_MODE:-absolute}
report_to_snyk=${REPORT_TO_SNYK:-false}
report_dir=${SNYK_REPORT_DIR:-sarif}
render_dir=${SNYK_RENDER_DIR:-rendered-templates}
summary_path=${GITHUB_STEP_SUMMARY:-}
overall_status=0

if [[ ! "$source_sha" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo "::error::source_sha must be a full commit SHA"
  exit 1
fi

if [[ "$scan_mode" != "delta" && "$scan_mode" != "absolute" && "$scan_mode" != "monitor" ]]; then
  echo "::error::SCAN_MODE must be delta, absolute, or monitor"
  exit 1
fi

if [[ "$scan_mode" == "delta" && -z "${SNYK_TOKEN:-}" ]]; then
  echo "::error::SNYK_TOKEN is required for Snyk Delta"
  exit 1
fi

if [[ "$scan_mode" == "delta" || "$scan_mode" == "monitor" ]] && [[ -z "${SNYK_ORG_ID:-}" ]]; then
  echo "::error::SNYK_ORG_ID is required for Snyk Delta and monitoring"
  exit 1
fi

if [[ "$scan_mode" != "monitor" && ! "$image_uri" =~ ^[^[:space:]@]+@sha256:[a-f0-9]{64}$ ]]; then
  echo "::error::image_uri must reference an immutable sha256 digest"
  exit 1
fi

if [[ "$report_to_snyk" != "true" && "$report_to_snyk" != "false" ]]; then
  echo "::error::REPORT_TO_SNYK must be true or false"
  exit 1
fi

mkdir -p "$report_dir" "$render_dir"

run_url="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}/attempts/${GITHUB_RUN_ATTEMPT:-1}"
if [[ -n "$summary_path" ]]; then
  {
    echo "## Snyk security gate"
    echo
    echo "- Source SHA: $source_sha"
    echo "- Image: $image_reference"
    echo "- Run: [${GITHUB_RUN_ID:-unknown}]($run_url)"
    echo
    echo "| Scan | Result |"
    echo "| --- | --- |"
  } > "$summary_path"
fi

record_status() {
  local name=$1
  local status=$2
  if [[ -n "$summary_path" ]]; then
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
if [[ "$scan_mode" != "monitor" ]]; then
  record_setup "ECR credentials" "${ECR_AUTH_OUTCOME:-success}"
  record_setup "ECR login" "${ECR_LOGIN_OUTCOME:-success}"
  record_setup "Helm installation" "${HELM_SETUP_OUTCOME:-success}"
fi
record_setup "Snyk CLI installation" "${SNYK_CLI_INSTALL_OUTCOME:-success}"
if [[ "$scan_mode" == "delta" ]]; then
  record_setup "Snyk Delta installation" "${SNYK_DELTA_INSTALL_OUTCOME:-success}"
fi
record_setup "Snyk OAuth action" "${SNYK_AUTH_OUTCOME:-success}"
record_setup "Snyk OAuth token masking" "${SNYK_TOKEN_MASK_OUTCOME:-success}"

policy_args=()
if [[ -f .snyk ]]; then
  policy_args+=(--policy-path=.snyk)
fi

run_scan() {
  local name=$1
  shift
  local fail_on_findings=false
  if [[ "${1:-}" == "--fail-on-findings" ]]; then
    fail_on_findings=true
    shift
  fi
  local exit_code

  echo "::group::Snyk $name"
  if "$@"; then
    exit_code=0
  else
    exit_code=$?
  fi
  echo "::endgroup::"

  case "$exit_code" in
    0) record_status "$name" passed ;;
    1)
      if [[ "$fail_on_findings" == "true" ]]; then
        echo "::error::Snyk $name found high-severity findings"
        overall_status=1
      else
        echo "::warning::Snyk $name found high-severity findings"
      fi
      record_status "$name" findings
      ;;
    *)
      echo "::error::Snyk $name failed with exit code $exit_code"
      record_status "$name" "tool error ($exit_code)"
      ;;
  esac
}

run_delta_scan() {
  local snyk_status
  local delta_status
  local -a pipeline_status

  echo "::group::Snyk Open Source Delta"
  snyk test --org="$SNYK_ORG_ID" \
    --project-name=laa-record-controlled-work-open-source \
    --target-reference=main \
    --dev --severity-threshold=high --json --print-deps "${policy_args[@]}" \
    | snyk-delta --targetReference main
  pipeline_status=("${PIPESTATUS[@]}")
  echo "::endgroup::"

  snyk_status=${pipeline_status[0]}
  delta_status=${pipeline_status[1]}
  if (( snyk_status > 1 )); then
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

if [[ "$scan_mode" == "monitor" ]]; then
  run_scan "Open Source monitoring" --fail-on-findings snyk monitor \
    --org="$SNYK_ORG_ID" --dev \
    --project-name=laa-record-controlled-work-open-source \
    --target-reference=main "${policy_args[@]}"
else
  if [[ "$scan_mode" == "delta" ]]; then
    run_delta_scan
  else
    run_scan "Open Source" --fail-on-findings snyk test --all-projects --dev \
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

  if [[ "$report_to_snyk" == "true" ]]; then
    run_scan "Code" snyk code test --severity-threshold=high --report \
      --project-name=laa-record-controlled-work-code --target-reference=main \
      --sarif-file-output="$report_dir/snyk-code.sarif"
  else
    run_scan "Code" snyk code test --severity-threshold=high \
      --sarif-file-output="$report_dir/snyk-code.sarif"
  fi

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

  if [[ -n "$summary_path" ]]; then
    printf '| Helm rendering | %s |\n' "$render_status" >> "$summary_path"
  fi

  if [[ "$report_to_snyk" == "true" ]]; then
    run_scan "IaC" snyk iac test "$render_dir" --severity-threshold=high \
      --report --target-name=laa-record-controlled-work-iac --target-reference=main \
      --sarif-file-output="$report_dir/snyk-iac.sarif" "${policy_args[@]}"
  else
    run_scan "IaC" snyk iac test "$render_dir" --severity-threshold=high \
      --sarif-file-output="$report_dir/snyk-iac.sarif" "${policy_args[@]}"
  fi
fi

if [[ -n "$summary_path" ]]; then
  echo >> "$summary_path"
  echo "Reports and rendered templates are attached to the [workflow run]($run_url)." >> "$summary_path"
fi

exit "$overall_status"