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
max=30
# Long names keep their start (ticket) and end (part) so stacked branches
# sharing a prefix don't collide on one Helm release.
# e.g. "mem-10234-export-means-something-else" becomes "mem-10234-means-something-else"
if [ "${#release}" -gt "$max" ]; then
  # Full ticket so it never loses digits, e.g. "mem-1302" or "mem-10234"
  head=$(echo "$release" | grep -oE '^[a-z]+-[0-9]+')
  # No ticket in the name: fall back to the first word, max 18 chars, e.g. "fix-this-thing"
  [ -z "$head" ] && head=$(echo "$release" | cut -d- -f1 | cut -c1-18)
  # Whatever is left of the max (minus the joining hyphen) goes to the end
  size=$((max - 1 - ${#head}))
  tail="${release: -$size}"
  tail="${tail#-}"
  release="$head-$tail"
fi
# Strip any trailing hyphen
release=$(echo "$release" | sed 's/-$//')

echo "$release"
