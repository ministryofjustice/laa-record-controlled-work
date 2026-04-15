#!/bin/bash
# Converts a git branch name into a valid Helm release name / URL segment.
# Usage: release_name=$(./scripts/release-name.sh "$BRANCH_NAME")
#        release_name=$(./scripts/release-name.sh)   # reads $BRANCH_NAME if no arg given

branch="${1:-$BRANCH_NAME}"

# Lowercase
release=$(echo "$branch" | tr '[:upper:]' '[:lower:]')
# Strip leading path segment (e.g. "feature/" or "renovate/")
release=$(echo "$release" | sed 's:^\w*\/::')
# Replace special character segments with singular hyphens
# (e.g. "foo...bar" becomes "foo-bar", rather than "foo---bar")
release=$(echo "$release" | tr -s ' _/[]().' '-')
# Truncate to 18 characters to keep release names and hostnames short
release=$(echo "$release" | cut -c1-18)
# Strip any trailing hyphen left by truncation
release=$(echo "$release" | sed 's/-$//')

echo "$release"
