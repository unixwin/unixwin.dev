# PORTAL-CONVENTIONS.md — unixwin.dev 工程约定（v2，2026-10-19）

> 面向所有后续贡献者（人或 agent）。v1 描述的三主题候选时代已结束；本文反映**当前事实**。
> 违反硬约束会破坏 i18n、双主题或事实审计链。

## 1. 页面清单（36 页，构建期实际产物）

| 路由 | 文件 | 语言 | 布局 |
|---|---|---|---|
| `/`、`/en/` | src/pages/{index,en/index}.astro | zh+en | 营销首页（两栏 hero 轮播 + 产品卡） |
| `/agents/`、`/en/agents/` | agents 目录页 | zh+en | 目录卡片 |
| `/agents/<slug>/` ×9 | agents/[slug].astro | zh | 详情（数据驱动 agents.json） |
| `/agents/universal/` | 通用接入指南 | zh | 文档 |
| `/ai/`、`/en/ai/` | AI 门户 | zh+en | 门户 |
| `/agents.md`、`/llms.txt` | 构建期文本端点 | — | 机器可读 |
| `/benchmarks/`、`/en/benchmarks/` | 基准 | zh+en | 表格+条形 |
| `/changelog/`、`/en/changelog/` | 更新日志聚合 | zh+en | 时间线 |
| `/docs/` + 4 篇差异 + `/docs/cli/` | 文档区 | zh | DocsLayout 三栏 |
| `/products/<id>/` ×6 | 产品文档页 | zh | DocsLayout |
| `/theme/clean/`、`/theme/neon/` | 历史候选（仅回看） | zh | 各自旧主题 |
| `/404`、`/install.ps1`、`/robots.txt`、`/og-image.png` | public/ | — | — |

## 2. 主题体系（重要变更）

- **默认 = day（亮色专业）/ night（暗色）**，tokens 在 `src/styles/tokens.css` 的 `[data-theme='day'|'night']`（改编自 astrowind，MIT，见 THIRD_PARTY_NOTICES.md）。
- BaseLayout 默认 `theme="day"`；`<head>` 内联脚本按 `localStorage.unixwin-theme`（无则 prefers-color-scheme）把 day 换 night，防 FOUC。
- SiteHeader 内 ToggleTheme 按钮仅 day↔night 生效；terminal/clean/neon 页自动隐藏。
- 旧三主题 tokens 保留（terminal 仍被 404 使用；clean/neon 供 /theme/* 回看）。**新页面禁止用旧主题**。
- 颜色仍只出自 tokens；`color-mix(in srgb, var(--x) N%, transparent)` 与数据注入的 `--card-accent` 除外。

## 3. i18n 规则

- zh 在根、en 在 `/en/`，**精确配对清单 = `src/i18n/lang.ts` 的 PAIRED_ZH_ROUTES**（现 6 条：/、/agents/、/benchmarks/、/ai/、/docs/、/changelog/）。
- 新增 en 页五步：建 `src/pages/en/<path>` → 把 zh 路径加进 PAIRED_ZH_ROUTES → 两页 BaseLayout 分别传 `lang`/`enPath` → 复查 resolveSwitchPair 用例 → build 后跑内链扫描。
- hreflang 与自动跳转**只认精确配对**；语言切换按钮用 `resolveSwitchPair()`（区段回退：/docs/**→/en/docs/、/agents/**→/en/agents/、/products/**→/en/ 等），回退不做 hreflang。
- 自动跳转：仅 zh 精确配对页，每会话一次（`niu-lang-auto`），`niu-lang-override` 优先；en 页永不反向跳。

## 4. 数据文件

| 文件 | 维护 | 说明 |
|---|---|---|
| products.json / facts.json / nav.json / docs-nav.json / agents.json / benchmarks.json | 手工 | 见各文件 _meta；**数字必须带证据口径** |
| changelogs.json / repo-meta.json | 生成 | `npm run fetch:github`（raw→main→gh 镜像→本地克隆四重回退），勿手改 |
| data/bench/ | 原样产物 | 15 份基准产物 + BENCH-README；fork 套件占位数据待 recheck TSV 入库转正 |

## 5. 事实审计铁律（2026-10-19 全站审计后立规）

1. **任何上页的命令/数字/输出，必须先在仓库文档、GitHub API 资产名或 preinstall/manifest 里找到原文**——查无实据不写（历史上因此翻车：wpm install winuxcmd、winget、假版本串、假安装输出、x64 口径）。
2. 预装事实基准：niubash Windows 安装器自带完整 WinuxCmd root（installer/niubash.iss `{app}\winuxcmd\`）+ 预装 gawk/niugit/ripgrep/fd（preinstall.json；**仅 gawk 为 x64-only**，niugit/rg/fd 双架构，ARM64 pin 已由 owner 确认生效）。
3. 页面与 README 冲突时以 FACTS.json（portal-dump 分支）裁决；README 待修项记录在 TODO 不阻塞门户。
4. 每张图/轮播的文案必须来自**实际看过内容**的素材，不得按文件名臆测。

## 6. 组件速查

BaseLayout（props: title/description/theme/path/lang/enPath/keywords/jsonLdExtra）· SiteHeader（含 LangSwitch+ToggleTheme）· SiteFooter · DocsLayout（三栏+面包屑+prev/next）· Sidebar（含搜索占位）· TocRight（On this page，客户端生成）· ThemeSwitcher（仅 /theme/*）· LangSwitch · CopyButton · InstallTabs · Badge · Section · StatsBand · ProductCard。
DocsLayout 内样式经 `.docs-main` 前缀的 `is:global` 提供（表格/代码/标题基线）；页面自有 scoped 样式优先。

## 7. 工作流

```bash
npm install && npm run fetch:github   # 刷新 changelogs/repo-meta
npm run dev                           # localhost:4321
npm run build                         # → dist/（36 页）
# 内链扫描（python 片段见仓库历史）断链必须为 0
sudo bash /home/cmx/deploy-unixwin.sh # 服务器 8889 部署（staging=~/unixwin-site-staging）
git push origin main                  # CI 自动构建
```

浏览器验收为发布前置工序（headless 截图 + DOM 断言，Playwright core 已可用）。
