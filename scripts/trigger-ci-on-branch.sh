#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <branch>"
  exit 1
fi

BRANCH="$1"
PRIOR_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$PRIOR_BRANCH" = "HEAD" ]; then
  echo "Error: not on a branch (detached HEAD). Please checkout a branch first."
  exit 1
fi

git fetch origin
git checkout "$BRANCH"
git commit --allow-empty -m "chore: trigger CI"
git push origin "$BRANCH"
git checkout "$PRIOR_BRANCH"
git branch -d "$BRANCH"
