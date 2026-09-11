#!/bin/bash
set -euo pipefail

rm -rf zap-results/hars
mkdir -p zap-results/hars
chmod 777 zap-results

E2E_ZAP_HAR_DIRECTORY="$(pwd)/zap-results/hars" \
  yarn test:e2e

yarn tsx zap/merge-hars.ts zap-results/hars zap-results/e2e-suite.har

docker run --rm --network host \
  -v "$(pwd)/zap/zap.yaml":/zap/wrk/zap.yaml:ro \
  -v "$(pwd)/zap-results":/zap/wrk/zap-results:rw \
  -t zaproxy/zap-stable \
  zap.sh -cmd -port 8090 -autorun /zap/wrk/zap.yaml