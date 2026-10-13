#!/usr/bin/env bash
set -euo pipefail

for name in ECR_REGISTRY_URL ECR_REPOSITORY AWS_REGION GITHUB_RUN_ID GITHUB_RUN_ATTEMPT GITHUB_STEP_SUMMARY; do
  if [[ -z "${!name:-}" ]]; then
    printf '::error::%s is required\n' "$name"
    exit 1
  fi
done

if [[ ! "$ECR_REGISTRY_URL" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ ]]; then
  printf '::error::Invalid ECR registry URL\n'
  exit 1
fi

if [[ ! "$ECR_REPOSITORY" =~ ^[a-z0-9]+([._-][a-z0-9]+)*(\/[a-z0-9]+([._-][a-z0-9]+)*)*$ ]]; then
  printf '::error::Invalid ECR repository\n'
  exit 1
fi

if [[ ! "$AWS_REGION" =~ ^[a-z]{2}(-gov)?-[a-z]+-[0-9]+$ ]]; then
  printf '::error::Invalid AWS region\n'
  exit 1
fi

if [[ ! "$GITHUB_RUN_ID" =~ ^[0-9]+$ || ! "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]; then
  printf '::error::Invalid GitHub run identity\n'
  exit 1
fi

for command_name in aws docker jq oras sha256sum cmp grep; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf '::error::Required command is missing: %s\n' "$command_name"
    exit 1
  fi
done

if ! oras version | grep -Fq 'Version: 1.3.4'; then
  printf '::error::The ECR probe requires ORAS 1.3.4\n'
  exit 1
fi

export AWS_PAGER=""

work_dir="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/rcw-ecr-sbom-probe.XXXXXX")"
subject_tag="sbom-probe-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}-subject"
unrelated_tag="sbom-probe-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}-unrelated"
cyclonedx_media_type="application/vnd.cyclonedx+json"
referrers_api="v1.1-referrers-api"
created_tags=()

cleanup() {
  local result=$?
  local cleanup_failed=0
  local tag
  local image_detail
  local digest
  local image_id
  local delete_result

  for tag in "${created_tags[@]}"; do
    if ! image_detail=$(aws ecr describe-images \
      --region "$AWS_REGION" \
      --repository-name "$ECR_REPOSITORY" \
      --image-ids "imageTag=$tag" \
      --query 'imageDetails[0]' \
      --output json 2>"$work_dir/cleanup.err"); then
      if ! grep -q 'ImageNotFoundException' "$work_dir/cleanup.err"; then
        printf '::warning::Unable to inspect disposable ECR probe image %s\n' "$tag"
        cleanup_failed=1
      fi
      continue
    fi

    digest=$(jq -er '.imageDigest | select(test("^sha256:[a-f0-9]{64}$"))' <<< "$image_detail") || {
      printf '::warning::Unable to validate disposable ECR probe image digest %s\n' "$tag"
      cleanup_failed=1
      continue
    }

    if jq -e --arg tag "$tag" \
      '(.imageTags // []) as $tags | ($tags | length) == 1 and $tags[0] == $tag' \
      <<< "$image_detail" >/dev/null; then
      image_id="imageDigest=$digest"
    else
      image_id="imageTag=$tag"
    fi

    if ! delete_result=$(aws ecr batch-delete-image \
      --region "$AWS_REGION" \
      --repository-name "$ECR_REPOSITORY" \
      --image-ids "$image_id" \
      --output json 2>"$work_dir/cleanup.err"); then
      if grep -q 'ImageNotFoundException' "$work_dir/cleanup.err"; then
        continue
      fi
      printf '::warning::Unable to delete disposable ECR probe image %s\n' "$tag"
      cleanup_failed=1
      continue
    fi

    if ! jq -e '(.failures // []) | length == 0' <<< "$delete_result" >/dev/null &&
      ! jq -e '(.failures // []) | length > 0 and all(.[]; .failureCode == "ImageNotFound")' \
        <<< "$delete_result" >/dev/null; then
      printf '::warning::Unable to delete disposable ECR probe image %s\n' "$tag"
      cleanup_failed=1
    fi
  done

  rm -rf "$work_dir"

  if [[ "$result" -eq 0 && "$cleanup_failed" -ne 0 ]]; then
    result=1
  fi
  exit "$result"
}
trap cleanup EXIT

aws ecr get-login-password --region "$AWS_REGION" |
  oras login --username AWS --password-stdin "$ECR_REGISTRY_URL"

build_probe_image() {
  local image_tag="$1"
  local payload="$2"
  local context_dir="$work_dir/$image_tag"
  local metadata_file="$work_dir/$image_tag-metadata.json"
  local image_reference="$ECR_REGISTRY_URL/$ECR_REPOSITORY:$image_tag"
  local pushed_digest
  local registry_digest

  mkdir -p "$context_dir"
  printf 'FROM scratch\nCOPY probe.txt /probe.txt\n' > "$context_dir/Dockerfile"
  printf '%s\n' "$payload" > "$context_dir/probe.txt"
  created_tags+=("$image_tag")

  docker buildx build \
    --platform linux/amd64 \
    --provenance=false \
    --sbom=false \
    --metadata-file "$metadata_file" \
    --push \
    --tag "$image_reference" \
    "$context_dir"

  pushed_digest=$(jq -er '.["containerimage.digest"] | select(test("^sha256:[a-f0-9]{64}$"))' "$metadata_file")
  registry_digest=$(aws ecr describe-images \
    --region "$AWS_REGION" \
    --repository-name "$ECR_REPOSITORY" \
    --image-ids "imageTag=$image_tag" \
    --query 'imageDetails[0].imageDigest' \
    --output text)

  if [[ "$registry_digest" != "$pushed_digest" ]]; then
    printf '::error::The ECR digest differs from the image push digest\n'
    return 1
  fi

  PROBE_IMAGE_DIGEST="$registry_digest"
}

build_probe_image "$subject_tag" 'RCW disposable SBOM referrer subject'
subject_digest="$PROBE_IMAGE_DIGEST"
subject_reference="$ECR_REGISTRY_URL/$ECR_REPOSITORY@$subject_digest"

build_probe_image "$unrelated_tag" 'RCW disposable unrelated image subject'
unrelated_digest="$PROBE_IMAGE_DIGEST"
unrelated_reference="$ECR_REGISTRY_URL/$ECR_REPOSITORY@$unrelated_digest"

if [[ "$subject_digest" == "$unrelated_digest" ]]; then
  printf '::error::Probe images unexpectedly resolved to the same digest\n'
  exit 1
fi

if printf 'invalid-probe-token' | oras discover \
  --distribution-spec "$referrers_api" \
  --format json \
  --depth 1 \
  --username rcw-probe-invalid \
  --password-stdin \
  "$subject_reference" >"$work_dir/denied.stdout" 2>"$work_dir/denied.stderr"; then
  printf '::error::Unauthorised ECR discovery unexpectedly succeeded\n'
  exit 1
fi

if ! grep -Eiq 'unauthorized|denied|(^|[^0-9])(401|403)([^0-9]|$)' "$work_dir/denied.stderr"; then
  printf '::error::Unauthorised ECR discovery failed for an unexpected reason\n'
  exit 1
fi

assert_no_cyclonedx_referrer() {
  local image_reference="$1"
  local output_path="$2"

  oras discover \
    --distribution-spec "$referrers_api" \
    --format json \
    --depth 1 \
    "$image_reference" > "$output_path"

  if ! jq -e --arg media_type "$cyclonedx_media_type" '
    type == "object" and
    (.referrers | type == "array") and
    ([.referrers[] | select(.artifactType == $media_type)] | length == 0)
  ' "$output_path" >/dev/null; then
    printf '::error::Unexpected CycloneDX evidence was found for %s\n' "$image_reference"
    return 1
  fi
}

assert_no_cyclonedx_referrer "$subject_reference" "$work_dir/subject-before.json"

sbom_path="$work_dir/sbom.cdx.json"
printf '{"bomFormat":"CycloneDX","specVersion":"1.6"}\n' > "$sbom_path"
if ! jq -e '
  type == "object" and
  keys == ["bomFormat", "specVersion"] and
  .bomFormat == "CycloneDX" and
  .specVersion == "1.6"
' "$sbom_path" >/dev/null; then
  printf '::error::Synthetic CycloneDX 1.6 document is invalid\n'
  exit 1
fi

sbom_checksum=$(sha256sum "$sbom_path" | awk '{print $1}')
subject_reference="$ECR_REGISTRY_URL/$ECR_REPOSITORY@$subject_digest"
attachment_digest=$(cd "$work_dir" && oras attach \
  --distribution-spec "$referrers_api" \
  --artifact-type "$cyclonedx_media_type" \
  --format go-template \
  --template '{{.digest}}' \
  "$subject_reference" \
  "sbom.cdx.json:$cyclonedx_media_type")

if [[ ! "$attachment_digest" =~ ^sha256:[a-f0-9]{64}$ ]]; then
  printf '::error::ORAS did not return a valid attachment digest\n'
  exit 1
fi

attachment_reference="$ECR_REGISTRY_URL/$ECR_REPOSITORY@$attachment_digest"
oras manifest fetch \
  --pretty \
  "$attachment_reference" > "$work_dir/attachment-manifest.json"

if ! jq -e \
  --arg subject_digest "$subject_digest" \
  --arg media_type "$cyclonedx_media_type" '
    .mediaType == "application/vnd.oci.image.manifest.v1+json" and
    .artifactType == $media_type and
    .subject.digest == $subject_digest and
    any(.layers[]?; .mediaType == $media_type)
  ' "$work_dir/attachment-manifest.json" >/dev/null; then
  printf '::error::Published referrer has an unexpected subject or media type\n'
  exit 1
fi

oras discover \
  --distribution-spec "$referrers_api" \
  --format json \
  --depth 1 \
  "$subject_reference" > "$work_dir/subject-after.json"

if ! jq -e \
  --arg attachment_digest "$attachment_digest" \
  --arg media_type "$cyclonedx_media_type" '
    type == "object" and
    (.referrers | type == "array") and
    ([.referrers[] | select(.artifactType == $media_type)] as $matches |
      ($matches | length) == 1 and
      $matches[0].digest == $attachment_digest and
      $matches[0].mediaType == "application/vnd.oci.image.manifest.v1+json")
  ' "$work_dir/subject-after.json" >/dev/null; then
  printf '::error::ECR discovery did not return the unique expected CycloneDX referrer\n'
  exit 1
fi

mkdir "$work_dir/retrieved"
oras pull --output "$work_dir/retrieved" "$attachment_reference"
retrieved_sbom="$work_dir/retrieved/sbom.cdx.json"

if [[ ! -f "$retrieved_sbom" ]] || ! cmp -s "$sbom_path" "$retrieved_sbom"; then
  printf '::error::Retrieved SBOM bytes differ from the published document\n'
  exit 1
fi

retrieved_checksum=$(sha256sum "$retrieved_sbom" | awk '{print $1}')
if [[ "$retrieved_checksum" != "$sbom_checksum" ]]; then
  printf '::error::Retrieved SBOM checksum differs from the expected checksum\n'
  exit 1
fi

assert_no_cyclonedx_referrer "$unrelated_reference" "$work_dir/unrelated.json"

{
  printf '## ECR OCI 1.1 SBOM referrer probe\n\n'
  printf -- '- Result: passed\n'
  printf -- '- Repository: %s\n' "$ECR_REPOSITORY"
  printf -- '- Subject digest: %s\n' "$subject_digest"
  printf -- '- Attachment digest: %s\n' "$attachment_digest"
  printf -- '- CycloneDX 1.6 SHA-256: %s\n' "$sbom_checksum"
  printf -- '- ORAS: 1.3.4\n'
} >> "$GITHUB_STEP_SUMMARY"