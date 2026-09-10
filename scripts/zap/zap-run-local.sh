#!/bin/bash
# Runs the ZAP scan locally. Requires the full stack to already be up 
# (e.g. run `docker/compose/up` in another terminal first)
set -euo pipefail

COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.override.yml -f docker/compose/zap.yml)

if [[ "$(docker compose "${COMPOSE_FILES[@]}" ps --status running --services 2>/dev/null | grep -cx nginx)" -eq 0 ]]; then
  echo "error: the stack isn't running yet. Start it first with 'docker/compose/up' in another terminal, then re-run this script." >&2
  exit 1
fi

mkdir -p zap-results
chmod 777 zap-results

E2E_ZAP_HAR_PATH="$(pwd)/zap-results/create-case.har" \
  yarn playwright test --config=tests/e2e/playwright.config.ts --grep "@zap" --project=chromium --workers=1

if [[ ! -s zap-results/create-case.har ]]; then
  echo "error: Playwright did not create the ZAP journey HAR." >&2
  exit 1
fi

node scripts/zap/sanitise-har.mjs zap-results/create-case.har

export NGINX_IP="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' rcw-nginx)"
SESSION_COOKIE="$(./scripts/zap/get-session-cookie.sh)"

sed "s|\${SESSION_COOKIE}|$SESSION_COOKIE|g" zap.yaml > zap-results/zap-plan.generated.yaml

docker compose \
  "${COMPOSE_FILES[@]}" \
  run --rm --no-deps zap-scan

echo "--- Opening report ---"
open zap-results/zap-baseline-report.html
