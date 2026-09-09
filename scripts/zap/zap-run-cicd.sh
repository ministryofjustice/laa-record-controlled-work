#!/bin/bash
set -euo pipefail

mkdir -p zap-results
chmod 777 zap-results

SESSION_COOKIE="$(./scripts/zap/get-session-cookie.sh)"

sed "s|\${SESSION_COOKIE}|$SESSION_COOKIE|g" zap.yaml > zap-results/zap-plan.generated.yaml

docker run --rm --network host \
  -v "$(pwd)/zap-results":/zap/wrk/zap-results:rw \
  -t zaproxy/zap-stable \
  zap.sh -cmd -port 8090 -autorun /zap/wrk/zap-results/zap-plan.generated.yaml
