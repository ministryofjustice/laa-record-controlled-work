#!/bin/bash
set -euo pipefail

mkdir -p zap-results
chmod 777 zap-results

E2E_ZAP_HAR_PATH="$(pwd)/zap-results/create-case.har" \
  yarn playwright test --config=tests/e2e/playwright.config.ts --grep "@zap" --project=chromium --workers=1

if [[ ! -s zap-results/create-case.har ]]; then
  echo "error: Playwright did not create the ZAP journey HAR." >&2
  exit 1
fi

docker run --rm --network host \
  -v "$(pwd)/zap.yaml":/zap/wrk/zap.yaml:ro \
  -v "$(pwd)/zap-results":/zap/wrk/zap-results:rw \
  -t zaproxy/zap-stable \
  zap.sh -cmd -port 8090 -autorun /zap/wrk/zap.yaml
