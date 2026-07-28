#!/usr/bin/env sh
set -e

PDA_API_VERSION_FILE=".pda-api-version"
PDA_API_REF="$(tr -d '[:space:]' < "${PDA_API_VERSION_FILE}")"
PDA_API_DIR=".pda-api"
PDA_API_FILE="${PDA_API_DIR}/open-api-specification.yml"

echo "[pda-api] Downloading API spec"
echo "[pda-api] Preparing output directory: ${PDA_API_DIR}"
mkdir -p "${PDA_API_DIR}"
echo "[pda-api] Version Ref:  ${PDA_API_REF}"
echo "[pda-api] File Output: ${PDA_API_FILE}"

if gh api -H "Accept: application/vnd.github.raw" \
  "/repos/ministryofjustice/laa-data-provider-data/contents/providers-api/open-api-specification.yml?ref=${PDA_API_REF}" \
  > "${PDA_API_FILE}"; then
  echo "[pda-api] Download complete"
else
  echo "[pda-api] Download failed." >&2
  exit 1
fi
