#!/usr/bin/env bash
set -uo pipefail

source_sha=${SOURCE_SHA:-}
image_uri=${IMAGE_URI:-}
image_reference=${IMAGE_REFERENCE:-}
report_dir=${SNYK_REPORT_DIR:-sarif}
render_dir=${SNYK_RENDER_DIR:-rendered-templates}
summary_path=${GITHUB_STEP_SUMMARY:-}
overall_status=0

if [[ ! "$source_sha" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo "::error::source_sha must be a full commit SHA"
  exit 1
fi

if [[ ! "$image_uri" =~ ^[^[:space:]@]+@sha256:[a-f0-9]{64}$ ]]; then
  echo "::error::image_uri must reference an immutable sha256 digest"
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
  if [[ "$status" != "passed" ]]; then
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
record_setup "ECR credentials" "${ECR_AUTH_OUTCOME:-success}"
record_setup "ECR login" "${ECR_LOGIN_OUTCOME:-success}"
record_setup "Helm installation" "${HELM_SETUP_OUTCOME:-success}"
record_setup "Snyk CLI installation" "${SNYK_CLI_INSTALL_OUTCOME:-success}"
record_setup "Snyk OAuth action" "${SNYK_AUTH_OUTCOME:-success}"
record_setup "Snyk OAuth token masking" "${SNYK_TOKEN_MASK_OUTCOME:-success}"

policy_args=()
if [[ -f .snyk ]]; then
  policy_args+=(--policy-path=.snyk)
fi

run_scan() {
  local name=$1
  shift
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
      echo "::error::Snyk $name found high-severity findings"
      record_status "$name" findings
      ;;
    *)
      echo "::error::Snyk $name failed with exit code $exit_code"
      record_status "$name" "tool error ($exit_code)"
      ;;
  esac
}

run_scan "Open Source" snyk test --dev --severity-threshold=high \
  --sarif-file-output="$report_dir/snyk-open-source.sarif" "${policy_args[@]}"

run_scan "Container" snyk container test "$image_uri" \
  --file=Dockerfile --severity-threshold=high \
  --sarif-file-output="$report_dir/snyk-container.sarif" "${policy_args[@]}"

run_scan "Container monitoring" snyk container monitor "$image_uri" \
  --file=Dockerfile "${policy_args[@]}"

run_scan "Code" snyk code test --severity-threshold=high \
  --sarif-file-output="$report_dir/snyk-code.sarif"

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

run_scan "IaC" snyk iac test "$render_dir" --severity-threshold=high \
  --sarif-file-output="$report_dir/snyk-iac.sarif" "${policy_args[@]}"

if [[ -n "$summary_path" ]]; then
  echo >> "$summary_path"
  echo "Reports and rendered templates are attached to the [workflow run]($run_url)." >> "$summary_path"
fi

exit "$overall_status"