#!/bin/bash
# Logs in via the mock OAuth2 IdP over plain HTTP and prints the resulting
# rcw.sid session cookie value to stdout.
#
# ZAP's "browser" authentication (Selenium) doesn't reliably hand the resulting
# session cookie off to its separate HTTP-client-based spider
# logging in ourselves here and injecting the cookie via zap.yaml's replacer job sidesteps that entirely. 
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

# Single office code so the app auto-selects it and skips the /select-office form.
CLAIMS='{"aud":"default","scp":"Applications.Read Applications.Write","oid":"test_user","tid":"test_tenant","FIRM_CODE":123456,"FIRM_NAME":"Test Legal Aid Firm Ltd","LAA_ACCOUNTS":["R1XEVG"],"USER_EMAIL":"test.user@example.com","USER_NAME":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","APP_ROLES":"Record Controlled Work User","preferred_username":"test.user@example.com","name":"Test User"}'

idp_url=$(curl -sk -c "$COOKIE_JAR" -D - -o /dev/null "$BASE_URL/auth/signin" \
  | grep -i '^location' | sed 's/^[Ll]ocation: //' | tr -d '\r')

callback_url=$(curl -sk -c "$COOKIE_JAR" -b "$COOKIE_JAR" -D - -o /dev/null "$idp_url" \
  --data-urlencode "username=test.user@example.com" \
  --data-urlencode "claims=$CLAIMS" \
  | grep -i '^location' | sed 's/^[Ll]ocation: //' | tr -d '\r')

curl -sk -c "$COOKIE_JAR" -b "$COOKIE_JAR" -o /dev/null "$callback_url"

awk '$6 == "rcw.sid" { print $7 }' "$COOKIE_JAR"
