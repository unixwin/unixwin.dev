# PORTAL-CONVENTIONS.md — unixwin.dev 工程约定

> 面向后续三位并行定制主题（A 终端 / B 亮色 / C 霓虹）的同事。
> 这里的规则是硬约束：违反任何一条都会破坏另外两套主题或多代理并行。

## 1. 文件树

```
unixwin.dev/
├── astro.config.mjs               # site=https://unixwin.dev；@astrojs/sitemap
├── package.json                   # astro ^5 / @astrojs/sitemap ^3；无其它运行时依赖
├── PORTAL-CONVENTIONS.md          # 本文件
├── README.md / LICENSE(MIT) / .gitignore
├── .github/workflows/build.yml    # push/PR → npm ci → npm run build
├── scripts/
│   ├── fetch-changelogs.mjs       # → src/data/changelogs.json
│   └── fetch-repo-meta.mjs        # → src/data/repo-meta.json
├── public/
│   ├── robots.txt                 # Allow:/ + Sitemap:…/sitemap-index.xml
│   ├── og-image.png               # 1200×630 社交分享图（可由设计稿替换）
│   └── favicon.svg
└── src/
    ├── styles/
    │   ├── tokens.css             # ★ 全站唯一颜色/字体/圆角/阴影来源
    │   └── global.css             # 元素级基础样式（仅引用 tokens）
    ├── components/
    │   ├── BaseLayout.astro       # 页面外壳：SEO 头 + <html data-theme>
    │   ├── SiteHeader.astro       # 吸顶导航（读 nav.json）
    │   ├── SiteFooter.astro       # 页脚（含主题候选提示）
    │   ├── CopyButton.astro       # data-copy 复制，✓ 1.5s
    │   ├── InstallTabs.astro      # 原生 JS tab 切换代码块
    │   ├── StatsBand.astro        # 数字指标带
    │   ├── ProductCard.astro      # 产品卡（--card-accent 数据注入）
    │   ├── Section.astro          # title + slot 区块
    │   ├── Badge.astro            # 小徽章，5 种 tone
    │   └── ThemeSwitcher.astro    # 右下角 A/B/C 悬浮胶囊
    ├── data/
    │   ├── products.json          # 六产品（手工维护）
    │   ├── facts.json             # 指标数字（手工维护）
    │   ├── nav.json               # 顶导航（手工维护）
    │   ├── changelogs.json        # ★ 生成物：npm run fetch:github
    │   └── repo-meta.json         # ★ 生成物：npm run fetch:github
    └── pages/
        ├── index.astro            # /           主题 A terminal
        ├── 404.astro              # /404        terminal 风
        ├── llms.txt.ts            # /llms.txt   构建期 text/plain 端点
        ├── changelog/index.astro  # /changelog/  terminal
        └── theme/
            ├── clean/index.astro  # /theme/clean/  主题 B
            └── neon/index.astro   # /theme/neon/   主题 C
```

★ = 机器生成，不要手改；其余手工维护。

## 2. 三主题 tokens 对照表（src/styles/tokens.css）

作用域：`[data-theme="terminal"]`（也是 `:root` 默认）、`[data-theme="clean"]`、
`[data-theme="neon"]`。变量名三套完全一致，只有值不同——**组件里永远只用
变量名**。

| 变量 | terminal（A） | clean（B） | neon（C） | 说明 |
| --- | --- | --- | --- | --- |
| `--bg` | `#0b1020` | `#ffffff` | `#0a0a16` | 页面底色 |
| `--bg-elev` | `#111832` | `#f6f8fb` | `#131328` | 卡片/页脚抬升层 |
| `--bg-code` | `#0d1428` | `#eef2f7` | `#0f0f22` | 代码块底 |
| `--text` | `#d7e0ee` | `#1a2233` | `#e8e6ff` | 正文 |
| `--muted` | `#8b98b8` | `#5b6779` | `#9a95c9` | 次要文字 |
| `--accent` | `#38e07b`（终端绿） | `#2563eb`（蓝） | `#a78bfa`（紫） | 主强调 |
| `--accent-2` | `#6fb7ff` | `#0ea5e9` | `#22d3ee`（青） | 次强调/渐变搭档 |
| `--link` | `#6fb7ff` | `#2563eb` | `#22d3ee` | 链接 |
| `--border` | `#223052` | `#dde4ee` | `#2b2b55` | 描边 |
| `--danger` | `#ff5c6c` | `#dc2626` | `#fb7185` | 错误/Removed |
| `--warn` | `#f5b83d` | `#d97706` | `#fbbf24` | 警告/Fixed 组 |
| `--radius` | `8px` | `12px` | `16px` | 圆角基准 |
| `--shadow` | 深色重投影 | `0 2px 10px` 轻阴影 | 紫色光晕 | 阴影 |
| `--font-sans` | 系统无衬线栈（三套相同） | 同左 | 同左 | 无衬线 |
| `--font-mono` | 等宽栈（三套相同） | 同左 | 同左 | 等宽 |
| `--font-body` ★扩展 | `var(--font-mono)` 整站等宽 | `var(--font-sans)` | `var(--font-sans)` | 该主题正文字体 |
| `--glass-bg` ★扩展 | `rgba(17,24,50,.72)` | `rgba(255,255,255,.85)` | `rgba(255,255,255,.05)` | 玻璃卡底 |
| `--glass-blur` ★扩展 | `8px` | `0px` | `14px` | 玻璃卡 backdrop-filter |

定制主题 = **只改 tokens.css 里你负责的那一组值 + 页面文案/布局微调**。
任何新颜色必须先进 tokens（三组都给值）再在组件里引用。

## 3. 组件 Props 速查 + 示例

所有组件在 `src/components/`，除 ThemeSwitcher/BaseLayout 外均无主题概念。

### BaseLayout（页面外壳，每页必用）
```astro
<BaseLayout title="更新日志" description="…" theme="terminal" path="/changelog/">
  <main>…</main>
</BaseLayout>
```
- `title`（必填）：自动拼 ` · UNIXWIN`；`description`（必填）；
- `theme`：`'terminal'|'clean'|'neon'`，写入 `<html data-theme>`（默认 terminal）；
- `path`：规范化路径，用于 canonical / hreflang(zh-CN,en,x-default 同页) /
  OG / Twitter 卡（og 图固定 `/og-image.png`）/ JSON-LD Organization（内建）。

### SiteHeader / SiteFooter（无 props）
数据来自 `nav.json` / `products.json`。Footer 固定含「主题候选 A/B/C 可右下角切换」提示。

### Section
```astro
<Section id="products" title="产品矩阵" kicker="six projects">…slot…</Section>
```
`id` 默认取 title；`kicker` 可选小字引导。

### Badge
```astro
<Badge tone="accent" text="Rust" />   或   <Badge tone="warn">Fixed</Badge>
```
`tone`: `accent | info | warn | danger | muted`（默认 accent）。

### StatsBand
```astro
<StatsBand items={[{ label: 'Unix 命令', value: '176+' }, …]} />
```

### ProductCard
```astro
<ProductCard product={products[0]} stars={repoMeta.repos?.niubash?.stars} />
```
`product` 为 products.json 单条；`stars` 可选（缺省回落 `product.stars`）。
产品主色经内联 `--card-accent` 注入（数据驱动，视为合法例外）。

### CopyButton
```astro
<CopyButton copy="irm https://dl.caomengxuan666.com/install.ps1 | iex" />
```
复制 `copy` 值，成功显示 ✓ 1.5 秒；`label` 可覆盖按钮文字。

### InstallTabs
```astro
<InstallTabs id="install" tabs={[
  { label: 'PowerShell', code: 'irm … | iex' },
  { label: 'wpm', code: 'wpm install winuxcmd' },
]} />
```
同页多实例时 `id` 必须唯一。原生 tab 切换 + 每面板自带 CopyButton。

### ThemeSwitcher（三页首页 + changelog + 404 都要挂）
```astro
<ThemeSwitcher current="clean" />
```
右下角 fixed 胶囊，A→`/`、B→`/theme/clean/`、C→`/theme/neon/`；
`current` 决定哪个圆钮以 accent 高亮（aria-current）。胶囊 title：
「主题候选 A·终端 / B·亮色 / C·霓虹——选好后告诉我们」。

## 4. 数据文件 schema

### products.json（手工，数组，六条）
| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `id` | string | 锚点/主键（`/#niubash`、repo-meta 键） |
| `name` | string | 展示名 |
| `cmd` | string | 命令行入口（`niu`…） |
| `repo` | string | `github.com/unixwin/<repo>`（不含 https://） |
| `lang` | string | 主语言徽章 |
| `stars` | number | 静态兜底星数（真实值看 repo-meta） |
| `accent` | string | 产品主色 hex，注入 `--card-accent` |
| `order` | number | 展示排序 1–6 |
| `tagline_zh` / `tagline_en` | string | 中/英一句话（en 供 llms.txt） |

### facts.json（手工，扁平键值）
键：`bashSuites`(83/83)、`byteIdentical`、`commands`(176+)、`options`(1,900+)、
`gitStartup`(~14 ms)、`shellColdStart`(~170 ms)、`binarySize`(3.79 MB)、
`unitTests`、`platforms`(5)。首页 StatsBand 取前六个键。

### nav.json（手工）
`org`/`github`/`docs` 供 Footer；`items[{label,href}]` 供 Header。

### changelogs.json（★生成物，勿手改）
```jsonc
{ "fetchedAt": "ISO8601",
  "repos": [ { "repo": "niubash", "source": "拉取来源 URL 或本地路径",
    "versions": [ { "version": "1.4.0", "date": "2026-10-10",
                     "unreleased": true,          // 可选
                     "sections": { "Added": ["纯文本行", …] } } ] } ] }
```
- `sections` 键为原文 `###` 组名（可为中文如「新增/修复」，可为 `""` 表示
  版本块内没有小组的散列条目）；
- 每仓最多 10 版，文档序（新→旧）；空对象 `{fetchedAt:null,repos:[]}` 为占位。

### repo-meta.json（★生成物，勿手改）
```jsonc
{ "fetchedAt": "ISO8601",
  "repos": { "niubash": { "stars": 178, "latest": "v1.4.0" }, … } }
```
键为 products.json 的 `id`（不是 repo 名）；`latest` 无 release 时为 null。

## 5. 页面路由清单

| 路由 | 文件 | 主题 | 要点 |
| --- | --- | --- | --- |
| `/` | `src/pages/index.astro` | terminal | Hero/Stats/产品网格/InstallTabs/主题候选 |
| `/theme/clean/` | `src/pages/theme/clean/index.astro` | clean | 同结构骨架（文案 TODO-CONTENT） |
| `/theme/neon/` | `src/pages/theme/neon/index.astro` | neon | 同结构骨架 + 玻璃卡展示 |
| `/changelog/` | `src/pages/changelog/index.astro` | terminal | 聚合时间线；空数据→提示跑 fetch |
| `/404` | `src/pages/404.astro` | terminal | 运行时回填 pathname 的 command not found |
| `/llms.txt` | `src/pages/llms.txt.ts` | — | 构建期 text/plain；Products 段自动来自 products.json |
| `/robots.txt` `/og-image.png` `/sitemap-index.xml` | `public/`+sitemap | — | 静态复制/集成生成 |

新增页面必须：套 BaseLayout + 挂 ThemeSwitcher + 只用 tokens。

## 6. 代码风格硬约束

1. **颜色只出自 tokens.css**。组件 `<style>` 里出现任何 hex/rgb/named color
   即违规（唯二例外：`color-mix(in srgb, var(--x) N%, transparent)` 与
   ProductCard 的内联 `--card-accent` 数据注入）。
2. 字体、圆角、阴影同理：`var(--font-mono)` / `var(--radius)` / `var(--shadow)`。
   玻璃卡统一 `background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur));`。
3. scoped CSS 写在各自 `.astro` 的 `<style>`；全局只允许改 `global.css`，
   且同样只引用变量。
4. 组件内 JS 用 `<script>`（Astro 打包去重，事件委托挂 document）；
   404 的路径回填用 `is:inline`。
5. TS 类型：Props 用 `interface Props`，禁 `any`。
6. 三套主题共用全部组件——不要为某主题写专用组件分支；差异全部体现在
   tokens 值与页面结构里。
7. 提交前自查：`npm run build` 通过 + 三主题页都能独立打开。

## 7. TODO-CONTENT 语义

源码中以 `<!-- TODO-CONTENT：… -->` 标记的是**占位文案/占位命令**，骨架
正确、内容待内容代理精修：

- 首页 hero 中英 tagline（当前为家族通用句，可按主题气质改写）；
- `/theme/clean/`、`/theme/neon/` 两页全部文案（结构与 `/` 对齐即可）；
- InstallTabs 的 `wpm 安装/升级` 两条命令为占位，需官方核对；
- `public/og-image.png` 为程序生成的过渡版，设计稿到位后直接覆盖同名文件。

规则：看到 TODO-CONTENT 注释 → 只改文案/媒体，不动结构、样式变量与 props。

## 8. 构建命令

```bash
npm install               # 或加 --registry=https://registry.npmmirror.com
npm run fetch:github      # 手动刷新两个生成 JSON（build 不自动跑；建议提交生成物）
npm run dev               # localhost:4321
npm run build             # → dist/（5 页 + llms.txt + robots + sitemap-index）
npm run preview           # 预览 dist
sudo bash /home/cmx/deploy-unixwin.sh   # 服务器部署；或 rsync dist/ 上服务器
```

CI（`.github/workflows/build.yml`）：push/PR → checkout → Node 22 →
`npm ci` → `npm run build`。
