#!/usr/bin/env bash
#
# Deploy the unixwin.dev portal placeholder (nginx :8889) and switch the
# Cloudflare Tunnel ingress (add unixwin.dev, remove the dead memos rule).
#
#   sudo bash /home/cmx/deploy-unixwin.sh
#
# Safe by construction (mirrors deploy-niubash.sh):
#   * nginx -t and `cloudflared tunnel ingress validate` run BEFORE anything restarts.
#   * /etc/cloudflared/config.yml is backed up with a timestamp suffix.
#   * The tunnel restart blips all hostnames for ~5s.
#   * The Cloudflare edge-cache purge at the end is best-effort: it never fails
#     the deploy (missing credentials or API errors just print and exit 0).

set -euo pipefail

SRC="/home/cmx/unixwin-site-staging"
CONF_SRC="/home/cmx/unixwin-nginx.conf"
DEST="/var/www/unixwin"
TUNCONF="/etc/cloudflared/config.yml"
CLOUDFLARED="/home/cmx/cloudflared"
TS="$(date +%Y%m%d-%H%M%S)"

say() { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run this with sudo:  sudo bash $0"
[ -f "$SRC/index.html" ] || die "placeholder not found at $SRC"
[ -f "$CONF_SRC" ] || die "nginx config not found at $CONF_SRC"

# ---------- Phase 1: static site on :8889 ----------

say "Installing static files to $DEST"
mkdir -p "$DEST"
rsync -a --delete "$SRC/" "$DEST/"

say "Installing nginx config (port 8889)"
cp "$CONF_SRC" /etc/nginx/conf.d/unixwin.conf

say "Validating nginx configuration"
nginx -t || die "nginx config invalid - nothing was reloaded"

systemctl reload nginx
sleep 1
code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8889/ || true)"
[ "$code" = "200" ] || die "port 8889 did not return 200 (got '${code}')"
printf '    http://127.0.0.1:8889/ -> %s\n' "$code"

# ---------- Phase 2: tunnel ingress (only if it actually changed) ----------
#
# cloudflared 只在 ingress 变更（增删 hostname / 改端口映射）时才需要重启；
# 纯内容发布只需上面的 nginx reload。这里先比对新旧配置，相同即跳过，
# 避免每次发布都对全部域名造成 ~5s 闪断。

TUN_DESIRED="$(mktemp)"
cat > "$TUN_DESIRED" <<'EOF'
tunnel: b8354427-78a1-4227-8731-dea9ee3d9590
credentials-file: /home/cmx/.cloudflared/b8354427-78a1-4227-8731-dea9ee3d9590.json

ingress:
  # niubash product site
  - hostname: dl.caomengxuan666.com
    service: http://localhost:8888
  # blog
  - hostname: blog.caomengxuan666.com
    service: http://localhost:1111
  # wpm China mirror + GitHub cache proxy
  - hostname: gh.caomengxuan666.com
    service: http://localhost:8890
  # UNIXWIN org portal
  - hostname: unixwin.dev
    service: http://localhost:8889
  # fallback
  - service: http_status:404
EOF

if cmp -s "$TUN_DESIRED" "$TUNCONF"; then
  say "Tunnel ingress unchanged - skipping rewrite and cloudflared restart (content-only deploy)"
  rm -f "$TUN_DESIRED"
else
  say "Tunnel ingress changed - updating $TUNCONF (backup: $TUNCONF.bak-$TS)"
  cp -a "$TUNCONF" "$TUNCONF.bak-$TS"
  cat "$TUN_DESIRED" > "$TUNCONF"
  rm -f "$TUN_DESIRED"

  say "Validating tunnel ingress"
  "$CLOUDFLARED" tunnel --config "$TUNCONF" ingress validate \
    || die "ingress invalid - tunnel NOT restarted, rollback: cp $TUNCONF.bak-$TS $TUNCONF"

  say "Restarting cloudflared (~5s blip on all hostnames - ingress changed)"
  systemctl restart cloudflared
  sleep 2
  systemctl is-active --quiet cloudflared || die "cloudflared not running! rollback: cp $TUNCONF.bak-$TS $TUNCONF && systemctl restart cloudflared"

  say "Spot-checking existing hostnames still answer"
  for h in dl.caomengxuan666.com blog.caomengxuan666.com gh.caomengxuan666.com; do
    c="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$h/" || true)"
    printf '    %-28s %s\n' "$h" "${c:-timeout}"
  done
fi

# ---------- Phase 3: purge Cloudflare edge cache (best effort - never blocks) ----------
#
# unixwin-portal/deploy/edge-cache.md 给 HTML 配了 5 分钟 Edge TTL；不 purge 的话，
# 发布后全网最长 5 分钟仍可能看到旧 HTML。这里调 CF API purge_everything 立即
# 失效整个 zone 的边缘缓存，把「≤5 分钟」收紧为「发布即见」。
# purge-cf-cache.sh 在缺 token / API 失败时都 exit 0，`|| true` 再加一层保险，
# CDN 侧任何故障都不影响本次发布。

say "Purging Cloudflare edge cache (best effort)"
export CF_API_TOKEN="${CF_API_TOKEN:-cfut_O3PTqog8R6FCQMqXLBoYzVcxD7P8M4sEWPbeusHAcc6ba48e}"
export ZONE_ID="${ZONE_ID:-fc8109ccdb7ef9787569e8cd0fe6f74b}"
bash /home/cmx/unixwin-portal/deploy/purge-cf-cache.sh || true

printf '\n\033[1;32mDeployed.\033[0m unixwin.dev goes live as soon as the zone is Active:\n'
printf '    curl -sI https://unixwin.dev/\n'
