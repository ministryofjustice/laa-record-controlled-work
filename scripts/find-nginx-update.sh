#!/usr/bin/env bash
# .github/workflows/mirror-nginx.yml check step
# finds the newest nginx-unprivileged x.y.z-alpine tag that is at least 3 days old
# and newer than the version in docker-images.env, then outputs its tag and digest
set -euo pipefail

REPO="nginxinc/nginx-unprivileged"
DOCKERHUB_API="https://hub.docker.com/v2/repositories/${REPO}/tags"
CANDIDATE_COUNT=5
AGE_DAYS=3

##########################################
output() {
  local key="$1" value="$2"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "${key}=${value}" >> "$GITHUB_OUTPUT"
  else
    echo "${key}=${value}"
  fi
}

summary() {
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    echo "$1" >> "$GITHUB_STEP_SUMMARY"
  fi
}

inspect_tag() {
  local tag="$1"
  METADATA=$(skopeo inspect "docker://${REPO}:${tag}")
  TAG=$(echo "$METADATA" | jq -r '.Labels["org.opencontainers.image.version"]')
  DIGEST=$(echo "$METADATA" | jq -r '.Digest')

  output "tag" "$TAG"
  output "amd64_digest" "$DIGEST"
}
##########################################
# override tag - inspect it directly and skip everything else
if [ -n "${OVERRIDE_TAG:-}" ]; then
  inspect_tag "$OVERRIDE_TAG"
  summary "### Override tag"
  summary "Selected **${TAG}** (override) with digest \`${DIGEST}\`."
  exit 0
fi

# skip age check — use the floating :alpine tag directly
if [ "${SKIP_AGE_CHECK:-}" = "true" ]; then
  inspect_tag "alpine"
  summary "### Age check skipped"
  summary "Selected **${TAG}** (latest :alpine) with digest \`${DIGEST}\`."
  exit 0
fi

# find the newest versioned alpine tag that's old enough
source docker-images.env # NGINX_IMAGE_TAG
CURRENT_TAG="${NGINX_IMAGE_TAG}"

CANDIDATES=$(skopeo list-tags "docker://${REPO}" \
  | jq -r '.Tags[]' \
  | grep -E '^[0-9]+\.[0-9]+\.[0-9]+-alpine$' \
  | sort -V \
  | tail -"${CANDIDATE_COUNT}" \
  | tac)

summary "### Version discovery"
summary "Current version: **${CURRENT_TAG}**"
summary "Top candidates: $(echo $CANDIDATES | tr '\n' ', ')"
summary ""

# skip immediately if the highest candidate is not newer than what we have
HIGHEST_TAG=$(echo "$CANDIDATES" | head -1)

if [ "${SKIP_VERSION_CHECK:-}" != "true" ]; then
  if [ "$HIGHEST_TAG" = "$CURRENT_TAG" ]; then
    summary "Already on the latest version **${CURRENT_TAG}**."
    output "tag" ""
    exit 0
  fi

  # verify the highest candidate is actually newer, not just different
  NEWER=$(printf '%s\n%s\n' "$CURRENT_TAG" "$HIGHEST_TAG" | sort -V | tail -1)
  if [ "$NEWER" = "$CURRENT_TAG" ]; then
    summary "Current version **${CURRENT_TAG}** is already ahead of all candidates."
    output "tag" ""
    exit 0
  fi
fi

# iterate through candidates, pick the first one that's old enough
CUTOFF=$(date -u -d "${AGE_DAYS} days ago" '+%s')
SELECTED=""

for CANDIDATE in $CANDIDATES; do
  # skip candidates that aren't newer than what we have
  if [ "${SKIP_VERSION_CHECK:-}" != "true" ]; then
    NEWER=$(printf '%s\n%s\n' "$CURRENT_TAG" "$CANDIDATE" | sort -V | tail -1)
    if [ "$NEWER" = "$CURRENT_TAG" ]; then
      summary "- Skipped ${CANDIDATE} (not newer than current ${CURRENT_TAG})"
      continue
    fi
  fi

  LAST_UPDATED=$(curl -s "${DOCKERHUB_API}/${CANDIDATE}" | jq -r '.last_updated')
  LAST_UPDATED_EPOCH=$(date -u -d "$LAST_UPDATED" '+%s')

  if [ "$LAST_UPDATED_EPOCH" -le "$CUTOFF" ]; then
    SELECTED="$CANDIDATE"
    summary "Selected **${CANDIDATE}** (last updated ${LAST_UPDATED})."
    break
  fi
  summary "- Skipped ${CANDIDATE} (last updated ${LAST_UPDATED}, less than ${AGE_DAYS} days ago)"
done

if [ -z "$SELECTED" ]; then
  summary ""
  summary "**No eligible version found** — all candidates newer than ${CURRENT_TAG} are less than ${AGE_DAYS} days old."
  output "tag" ""
  exit 0
fi

DIGEST=$(skopeo inspect "docker://${REPO}:${SELECTED}" | jq -r '.Digest')
output "tag" "$SELECTED"
output "amd64_digest" "$DIGEST"
