#!/bin/bash
# Merges the HARs already recorded by the e2e workflow's test run, then scans them.
# Requires zap-results/hars/ to already contain HAR files (see .github/workflows/e2e.yml).
set -euo pipefail

yarn tsx zap/merge-hars.ts zap-results/hars zap-results/e2e-suite.har

docker run --rm --network host \
  -v "$(pwd)/zap/zap.yaml":/zap/wrk/zap.yaml:ro \
  -v "$(pwd)/zap-results":/zap/wrk/zap-results:rw \
  -t zaproxy/zap-stable \
  zap.sh -cmd -port 8090 -autorun /zap/wrk/zap.yaml