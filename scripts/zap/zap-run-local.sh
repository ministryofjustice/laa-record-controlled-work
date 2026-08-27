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

docker compose \
  "${COMPOSE_FILES[@]}" \
  run --rm --no-deps zap-scan

echo "--- Opening report ---"
open zap-results/zap-baseline-report.html
