#!/bin/bash
# Converts a git branch name into a valid Helm release name / URL segment.
# Usage: release_name=$(./scripts/release-name.sh "$BRANCH_NAME")
#        release_name=$(./scripts/release-name.sh)   # reads $GITHUB_REF_NAME if no arg given

branch="${1:-$GITHUB_REF_NAME}"
echo "$branch" | tr '[:upper:]' '[:lower:]' | sed 's:^\w*\/::' | tr -s ' _/[]().' '-' | cut -c1-18 | sed 's/-$//'
