#!/usr/bin/env sh

set -eu

HOOK_FILE=".git/hooks/pre-commit"
MARKER="# RCW PATH patch for GUI git clients"

if [ ! -f "$HOOK_FILE" ]; then
  exit 0
fi

if grep -Fq "$MARKER" "$HOOK_FILE"; then
  exit 0
fi

TMP_FILE=$(mktemp)

awk -v marker="$MARKER" '
  {
    print
    if ($0 ~ /^PREK=/ && inserted == 0) {
      print marker
      print "PATH=\"/opt/homebrew/bin:/usr/local/bin:$PATH\""
      print "export PATH"
      inserted = 1
    }
  }
' "$HOOK_FILE" > "$TMP_FILE"

mv "$TMP_FILE" "$HOOK_FILE"
chmod +x "$HOOK_FILE"
