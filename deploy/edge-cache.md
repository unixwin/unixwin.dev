# Cloudflare HTML 边缘缓存方案（unixwin.dev）

> 目标：静态 HTML 在 CF 边缘缓存 5 分钟，消除「HTML no-cache + DYNAMIC → 每次国内隧道
> 回源（TTFB 1.4–3s）」的加载瓶颈。实测根因：静态资产（CSS/JS/图片/字体）已边缘 HIT，
> 唯 HTML 每次回源。本方案一次配置，全站生效。

---

## 1. 现状与根因

| 资产 | CF 状态 | TTFB |
| --- | --- | --- |
| CSS/JS/字体/图片 | **HIT**（边缘缓存） | <100ms |
| HTML（所有页面） | **DYNAMIC**（no-cache，每次回源） | **1.4–3s** |

原因：源站 HTML 响应带 `Cache-Control: no-cache`（发布即见的正确语义），CF 对
`no-cache` 默认不缓存 → 每个请求都穿过国内到源站的隧道。静态资产本身无此头，
CF 默认按扩展名缓存，所以早已 HIT。

解法：**Cache Rule 只改「边缘这一跳」**——Edge TTL override 5 分钟让 CF 边缘缓存
HTML；Browser TTL respect origin 保持浏览器侧 `no-cache` 不变。两层语义互不干扰：

- **边缘**：缓存 300s → 回源频率从「每个 PV 一次」降到「每 5 分钟每 PoP 至多一次」；
- **浏览器**：仍 no-cache，每次都向边缘 revalidate → 用户永远拿到边缘最新副本，
  发布语义不变（配合发布后 purge 可做到立即全网可见）。

## 2. 面板配置（推荐，两分钟完成）

路径：**Cloudflare Dashboard → 选中 unixwin.dev 域 → Caching → Cache Rules → Create rule**

1. **Rule name**：`cache-html-5min`（随意）。
2. **When incoming requests match**：选 **Custom filter expression**：
   - Field: `Hostname`
   - Operator: `equals`
   - Value: `unixwin.dev`
   - 对应表达式：`(http.host eq "unixwin.dev")`
   - （用 **Edit expression** 可直接粘贴上面整串表达式。）
3. **Then**（设置区）：
   - **Cache eligibility**：`Eligible for cache`
   - **Edge TTL**：`Override origin` / "Ignore cache-control header and use this TTL"
     → TTL 填 **5 minutes**（300 秒）
   - **Browser TTL**：`Respect origin`（**保持源站 no-cache 原样透传**，发布即见的语义不变）
   - 其他设置全部留空/默认。
4. **Place at**：放在规则列表**最顶部**（见下「规则顺序」）。
5. **Deploy**。

**覆盖范围**：规则按 Hostname 匹配，整站生效——HTML、`/llms.txt`、`/agents.md`
以及一切静态文件都在内（`llms.txt`/`agents.md` 目前同样 no-cache 回源，本规则顺带修复）。
不匹配 `www` 等其他子域时无需额外排除；如需覆盖 `www.unixwin.dev`，把表达式改为
`(http.host in {"unixwin.dev" "www.unixwin.dev"})`。

### 规则顺序（重要）

Cache Rules 按**列表自上而下**求值，**命中的第一条规则生效**（topmost wins），
与负载均衡/重定向类规则一致。因此：

- 本规则应置于列表**最上方**（Place at → first）；
- 若未来加更细的规则（如某路径 bypass cache），**更具体的放上面、整站宽匹配放下**；
  宽匹配压在具体规则之上会把它短路掉；
- 规则优先级高于 Caching → Configuration 里的全站默认缓存设置。

## 3. CF API v4 一条命令（CI/可重复执行）

Cache Rules 属于 Ruleset Engine 的 `http_request_cache_settings` phase。
端点（均为 zone 级）：

```
GET   /zones/{zone_id}/rulesets/phases/http_request_cache_settings/entrypoint            # 读当前规则
PUT   /zones/{zone_id}/rulesets/phases/http_request_cache_settings/entrypoint            # 整体替换（含 rules 数组）
PATCH /zones/{zone_id}/rulesets/phases/http_request_cache_settings/entrypoint/rules/{rule_id}  # 改单条
```

> **PUT 会整体替换该 phase 的全部规则。** 若 zone 里已有其他 cache rule，先 GET
> 取出 `result.rules` 合并后再 PUT；全新 zone 直接 PUT 下面的单条即可。

**可直接执行的一条命令**（jq 构造 rule JSON；需环境变量 `CF_API_TOKEN`、`ZONE_ID`，
Token 权限：`Zone → Cache Rules: Edit`）：

```bash
jq -n '{rules:[{action:"set_cache_settings",
        expression:"(http.host eq \"unixwin.dev\")",
        description:"cache-html-5min (HTML/llms.txt/agents.md, edge 5min, browser respect origin)",
        enabled:true,
        action_parameters:{cache:true,
          edge_ttl:{mode:"override_origin",default:300},
          browser_ttl:{mode:"respect_origin"}}}]}' \
| curl -sX PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json" \
    --data @- \
| jq '{success, errors, rules: [.result.rules[] | {id, description, expression, enabled}]}'
```

预期输出：`"success": true`，`rules` 数组含上面这条规则（首次 PUT 会创建 entrypoint
ruleset 并返回其 `id`）。

改单条（不碰其他规则）：

```bash
curl -sX PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint/rules/${RULE_ID}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json" \
  -d '{"action":"set_cache_settings","expression":"(http.host eq \"unixwin.dev\")",
       "description":"cache-html-5min","enabled":true,
       "action_parameters":{"cache":true,
         "edge_ttl":{"mode":"override_origin","default":300},
         "browser_ttl":{"mode":"respect_origin"}}}' | jq '.success, .errors'
```

> 同 phase 若从未创建过 entrypoint ruleset，PATCH 会 404——首次请用上面的 PUT。

## 4. 验证

```bash
# 第一次（ MISS，回源一次）：
curl -sI https://unixwin.dev/ | grep -iE 'cf-cache-status|cache-control|age'
# cf-cache-status: MISS        ← 首次
# 第二次：
curl -sI https://unixwin.dev/ | grep -i cf-cache-status
# cf-cache-status: HIT         ← 生效
# age 会随时间增长，>300 后回落（新 MISS → 重新 HIT）
```

同时确认 `cache-control: no-cache` 仍原样出现在响应头（Browser TTL respect origin
生效，浏览器侧语义未变）。`/llms.txt`、`/agents.md` 同法各验一次。

## 5. 预期收益

| 指标 | 配置前 | 配置后 |
| --- | --- | --- |
| HTML `cf-cache-status` | DYNAMIC（100% 回源） | **HIT**（仅每 PoP 每 5 分钟一次 MISS） |
| 页面 TTFB（国内访问） | **1.4–3s**（隧道回源） | **<100ms**（边缘命中） |
| 首屏加载（HTML 占大头） | 2–3s | ≈ 静态资产水平，整体 <0.5s |
| 发布后全网新鲜度 | 立即（但每个请求都慢） | ≤5 分钟（Edge TTL 300s） |

补充（可选加固）：发布脚本（`deploy-unixwin.sh` / `deploy-niubash.sh`）末尾追加一次
purge（`POST /client/v4/zones/$ZONE_ID/purge_cache`，`{"purge_everything":true}` 或按
URL 列表），即可把「≤5 分钟」收紧为「发布即见」，同时不影响边缘缓存收益。
（`deploy-unixwin.sh` 已按此落地：见 §7「发布即见」。）

## 6. 附：资产快速收益排查（未改动，仅记录）

| 文件 | 大小 | 状态 / 建议 |
| --- | --- | --- |
| `public/og-image.png` | **35KB**（35,173 B） | 已是压缩后尺寸（题述 365KB 为旧数据），无需处理 |
| `public/assets/niubash-banner.svg` | **104KB**（103,135 B） | 内联样式/路径冗余可再省 30–60%：`svgo --multipass` 后可到 ~40KB；只在 banner 页引用，非首屏瓶颈，低优先 |
| `public/assets/demo-gitbash.gif` | 366KB | 首页/EN 首页均 `loading="lazy"`（src/pages/index.astro:365、en/index.astro:393），不阻塞首屏；如想再省，转 WebM/MP4 可到 <100KB，可选 |
| `public/fonts/fraunces-latin-wght-normal.woff2` | 67KB | 已加 preload（BaseLayout），与 CSS 并行加载 |

## 7. 发布即见：部署钩子自动 purge（已集成）

§5 的「补充」已落地：`deploy-unixwin.sh` 在站点文件上线（rsync + nginx reload；
tunnel ingress 未变更时按既有逻辑跳过重启）之后、打印 `Deployed.` 之前，
best-effort 调用仓库里的 purge 脚本：

```bash
bash /home/cmx/unixwin-portal/deploy/purge-cf-cache.sh || true
```

脚本调 CF API v4 `POST /client/v4/zones/{zone}/purge_cache`，body 为
`{"purge_everything":true}`（host 级精准 purge 需 Enterprise，不用它）。
设计上**绝不阻塞发布**，三种情形的行为：

| 情形 | 行为 |
| --- | --- |
| `CF_API_TOKEN` / `ZONE_ID` 未设置 | 打印友好提示并 exit 0（缓存按 5 分钟 TTL 自然过期） |
| API 调用成功 | 打印 purge 结果摘要，随后正常输出 `Deployed.` |
| API / 网络失败 | 仅打 WARN 并 exit 0，发布照常完成 |

### 配置凭据（一次性）

- **CF_API_TOKEN**：Dashboard 右上角头像 → **My Profile → API Tokens → Create Token**，
  选 **Edit zone Cache Purge** 权限模板即可（等价权限：`Zone → Cache Purge → Purge`）；
  Zone Resources 限定 `unixwin.dev`。创建后复制 Token（只显示一次）。
- **ZONE_ID**：Dashboard → 选中 unixwin.dev → 域名 **Overview** 页右栏的 **Zone ID**。

### 注入环境变量（部署以 sudo 运行，注意 sudo 默认 env_reset）

```bash
# 方式 A（推荐）：部署时内联，写在 sudo 之后，sudo 会原样传给目标命令
sudo CF_API_TOKEN=xxxx ZONE_ID=yyyy bash /home/cmx/deploy-unixwin.sh

# 方式 B（持久化）：~/.bashrc export + sudoers env_keep
#   （不配 env_keep 的话，sudo 的 env_reset 会把 cmx shell 里的变量剥掉）
echo 'Defaults env_keep += "CF_API_TOKEN ZONE_ID"' | sudo tee /etc/sudoers.d/cf-purge
# 之后在 ~/.bashrc 中 export CF_API_TOKEN=... / ZONE_ID=... 即可穿透 sudo 生效
```

### 效果与验证

发布完成后边缘缓存立即失效：下一次请求 `cf-cache-status: MISS`（回源一次拿到新
HTML），其后恢复 HIT——「发布后全网新鲜度」从 ≤5 分钟收紧为**即时**，
§5 的边缘缓存收益（TTFB <100ms）不受影响。

验证脚本本身（不碰真 API）：不带 token 跑 `bash deploy/purge-cf-cache.sh`
应打印跳过提示并以退出码 0 结束。
