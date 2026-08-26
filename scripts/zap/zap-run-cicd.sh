#!/bin/bash
set -euo pipefail

mkdir -p zap-results
chmod 777 zap-results

docker compose \
  -f docker-compose.yml \
  -f docker-compose.override.yml \
  -f docker/compose/ci.yml \
  -f docker/compose/zap.yml \
  run --rm --no-deps zap-scan
