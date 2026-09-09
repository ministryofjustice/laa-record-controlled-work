#!/bin/bash
set -euo pipefail

mkdir -p zap-results
chmod 777 zap-results

docker run --rm --network host \
  -v "$(pwd)/zap.yaml":/zap/wrk/zap.yaml:ro \
  -v "$(pwd)/zap-results":/zap/wrk/zap-results:rw \
  -t zaproxy/zap-stable \
  zap.sh -cmd -port 8090 -autorun /zap/wrk/zap.yaml
