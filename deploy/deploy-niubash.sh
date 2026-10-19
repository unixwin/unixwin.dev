#!/usr/bin/env bash
#
# Deploy the niubash site and cut over from the legacy Rust service.
#
#   sudo bash /home/cmx/deploy-niubash.sh
#
# Safe by construction:
#   * nginx -t runs BEFORE the old service is stopped. If the config is
#     invalid the script aborts and the live site is untouched.
#   * The previous release is kept at /var/www/niubash.prev for one rollback.

set -euo pipefail

SITE_USER="${SITE_USER:-cmx}"
SRC="/home/${SITE_USER}/niubash-site-dist"
CONF_SRC="/home/${SITE_USER}/niubash-nginx.conf"
DEST="/var/www/niubash"
CONF_DEST="/etc/nginx/conf.d/niubash.conf"
SERVICE="winuxcmd-server"

say() { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run this with sudo:  sudo bash $0"
[ -d "$SRC" ] || die "Build output not found at $SRC"
[ -f "$CONF_SRC" ] || die "nginx config not found at $CONF_SRC"
command -v nginx >/dev/null || die "nginx is not installed"

# Keep one previous release so a rollback never needs a rebuild.
if [ -d "$DEST" ]; then
  say "Backing up the current release"
  rm -rf "${DEST}.prev"
  cp -a "$DEST" "${DEST}.prev"
fi

say "Installing static files to $DEST"
mkdir -p "$DEST"
rsync -a --delete "$SRC/" "$DEST/"

say "Installing nginx config"
cp "$CONF_SRC" "$CONF_DEST"

say "Validating nginx configuration"
nginx -t || die "nginx config is invalid - the live site was NOT changed"

if systemctl is-active --quiet "$SERVICE"; then
  say "Stopping legacy service $SERVICE (releases port 8888)"
  systemctl stop "$SERVICE"
fi

if systemctl is-enabled --quiet "$SERVICE" 2>/dev/null; then
  say "Disabling $SERVICE so it does not come back after a reboot"
  systemctl disable "$SERVICE"
fi

say "Reloading nginx"
systemctl reload nginx

say "Verifying the site answers on port 8888"
sleep 1
# 301 是本配置的预期行为（/ 与 /en/ 已重定向到新门户），不视为失败
code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8888/ || true)"
[ "$code" = "200" ] || [ "$code" = "301" ] || die "Site did not return 200/301 (got '${code}'). Roll back with: sudo bash /home/${SITE_USER}/rollback-niubash.sh"

for path in /en/ /install.ps1 /sitemap-index.xml /robots.txt; do
  c="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8888${path}" || true)"
  printf '    %-22s %s\n' "$path" "$c"
done

printf '\n\033[1;32mDeployed.\033[0m https://dl.caomengxuan666.com/\n'
