#!/usr/bin/env bash
#
# purge-cf-cache.sh - purge the Cloudflare edge cache for one zone (best effort).
#
# Called by deploy-unixwin.sh right after the site goes live, so the 5-minute
# Edge TTL (see edge-cache.md) never delays a release: after the purge, the
# next request per PoP is a MISS that fetches the fresh HTML, then HITs again.
#
# Usage:
#   CF_API_TOKEN=... ZONE_ID=... bash purge-cf-cache.sh
#
# Contract (best-effort by design - a deploy must never fail here):
#   * CF_API_TOKEN or ZONE_ID unset -> friendly hint, exit 0
#   * API / network failure         -> warning only, exit 0
#   * success                       -> one-line purge summary
#
# Token permission: Zone -> Cache Purge -> Purge. purge_everything works on all
# plans (host-level precise purge needs Enterprise, so we don't use it).

set -uo pipefail

TAG='\033[1;36m==> [cf-purge]\033[0m'
WTAG='\033[1;33mWARN [cf-purge]\033[0m'
API="https://api.cloudflare.com/client/v4"

TOKEN="${CF_API_TOKEN:-}"
ZONE="${ZONE_ID:-}"

note() { printf '%b\n' "${TAG} $*"; }
warn() { printf '%b\n' "${WTAG} $*" >&2; }

if [[ -z "$TOKEN" || -z "$ZONE" ]]; then
  note "CF_API_TOKEN / ZONE_ID not set - skipping Cloudflare cache purge."
  note "(edge cache expires naturally via its 5-min TTL; to purge on every deploy, see deploy/edge-cache.md section 7 '发布即见')"
  exit 0
fi

if ! command -v curl >/dev/null 2>&1; then
  warn "curl not found - skipping Cloudflare cache purge."
  exit 0
fi

note "Purging Cloudflare edge cache (purge_everything, zone ${ZONE})..."

RESP="$(curl -sS --max-time 15 -w '\n%{http_code}' \
  -X POST "${API}/zones/${ZONE}/purge_cache" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}' 2>&1)"
CURL_RC=$?

if [[ "${CURL_RC}" -ne 0 ]]; then
  warn "Cloudflare API unreachable (deploy continues): curl rc=${CURL_RC} ${RESP}"
  exit 0
fi

HTTP_CODE="${RESP##*$'\n'}"
BODY="${RESP%$'\n'*}"

if command -v jq >/dev/null 2>&1; then
  OK="$(printf '%s' "$BODY" | jq -r '.success // false' 2>/dev/null || echo false)"
  if [[ "$OK" == "true" ]]; then
    note "Done: edge cache purged (purge_everything=true, zone ${ZONE}, HTTP ${HTTP_CODE})."
    note "Release is live at the edge; next request per PoP re-fetches fresh HTML (MISS) then HITs again."
    exit 0
  fi
  ERRS="$(printf '%s' "$BODY" | jq -r '[.errors[]? | "\(.code): \(.message)"] | join("; ")' 2>/dev/null)"
  warn "Cloudflare purge failed (HTTP ${HTTP_CODE}, deploy continues): ${ERRS:-${BODY:0:300}}"
  exit 0
fi

# no jq available: fall back to a plain text match
if printf '%s' "$BODY" | grep -q '"success"[[:space:]]*:[[:space:]]*true'; then
  note "Done: edge cache purged (purge_everything=true, zone ${ZONE}, HTTP ${HTTP_CODE})."
  exit 0
fi
warn "Cloudflare purge failed (HTTP ${HTTP_CODE}, deploy continues): ${BODY:0:300}"
exit 0
