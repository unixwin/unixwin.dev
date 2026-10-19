# unixwin.dev — UNIXWIN 官网

[UNIXWIN](https://github.com/unixwin) 的官网与主题候选工程，开源地址：
<https://github.com/unixwin/unixwin.dev>，线上地址 <https://unixwin.dev>。

纯 [Astro 5](https://astro.build) 静态站：无 UI 框架、无 Tailwind，仅 scoped CSS +
全局 design tokens；三套主题候选通过 `<html data-theme="...">` 切换。

## 项目简介

展示 UNIXWIN 的 AI-native bash 家族六个产品（niubash / WinuxCmd / rubash /
niu-git / wpm / oh-my-niu），聚合各仓库 CHANGELOG，并公开三套官网主题候选
（A 终端 / B 亮色 / C 霓虹）供社区选择。

## 目录结构

```
unixwin.dev/
├── astro.config.mjs          # site=https://unixwin.dev + sitemap 集成
├── package.json              # scripts: dev / build / preview / fetch:github
├── scripts/
│   ├── fetch-changelogs.mjs  # 拉取解析各仓库 CHANGELOG.md
│   └── fetch-repo-meta.mjs   # 拉取 GitHub stars 与最新 release tag
├── public/                   # robots.txt / og-image.png / favicon.svg
├── .github/workflows/build.yml
└── src/
    ├── styles/tokens.css     # 三主题 tokens（唯一颜色来源）
    ├── styles/global.css     # 全局基础样式（只用 tokens）
    ├── components/           # BaseLayout / SiteHeader / SiteFooter /
    │                         # CopyButton / InstallTabs / StatsBand /
    │                         # ProductCard / Section / Badge / ThemeSwitcher
    ├── data/                 # products / facts / nav / changelogs / repo-meta
    └── pages/
        ├── index.astro               # 主题 A（terminal）
        ├── 404.astro
        ├── llms.txt.ts               # 构建期生成 /llms.txt
        ├── changelog/index.astro     # 聚合更新日志
        └── theme/{clean,neon}/index.astro  # 主题 B / C 预览
```

组件 props、数据 schema、tokens 对照表与代码风格约束见
[PORTAL-CONVENTIONS.md](./PORTAL-CONVENTIONS.md)（后续定制主题的同事必读）。

## 数据拉取（npm run fetch:github）

```bash
npm run fetch:github
# = node scripts/fetch-changelogs.mjs && node scripts/fetch-repo-meta.mjs
```

- `fetch-changelogs.mjs`：按 niubash / WinuxCmd / rubash / niu-git / oh-my-niu
  依次尝试 raw.githubusercontent.com（master → main）→ gh.caomengxuan666.com
  镜像 → 本地 `~/unixwin-repos/<repo>/CHANGELOG.md`，解析 Keep a Changelog
  格式，每仓保留最近 10 版，写 `src/data/changelogs.json`。单仓失败仅告警跳过。
- `fetch-repo-meta.mjs`：GitHub API 取六仓库 stars 与最新 release tag；
  未认证 403 时回退到旧缓存 + changelogs.json 首版本，写 `src/data/repo-meta.json`。
  可选环境变量 `GITHUB_TOKEN` 提高限额。
- `npm run build` **不会**自动执行拉取（CI 与本地均手动跑），生成的 JSON 会
  提交进仓库，因此 CI 只需 `npm ci && npm run build`。

## 本地开发与构建

```bash
npm install          # 依赖安装（国内网络可加 --registry=https://registry.npmmirror.com）
npm run fetch:github # 可选：刷新 changelogs.json / repo-meta.json
npm run dev          # http://localhost:4321
npm run build        # 产物输出 dist/
npm run preview      # 本地预览 dist/
```

## 部署

```bash
npm run build
sudo bash /home/cmx/deploy-unixwin.sh        # 服务器上的部署脚本
# 或直接 rsync：
rsync -av --delete dist/ <user>@<host>:/var/www/unixwin.dev/
```

## 三主题候选

| 候选 | URL | 风格 |
| ---- | --- | ---- |
| A · 终端 terminal | <https://unixwin.dev/> | 深空底色、整站等宽、终端绿 |
| B · 亮色 clean | <https://unixwin.dev/theme/clean/> | 白底无衬线、12px 圆角、轻阴影 |
| C · 霓虹 neon | <https://unixwin.dev/theme/neon/> | 紫青双色、玻璃卡渐变、16px 圆角 |

任意页面右下角悬浮胶囊可切换 A / B / C；选定后我们会移除其余两套并将
胜出主题合并为唯一 `<html data-theme>`。

## 推送到 github.com/unixwin/unixwin.dev

```bash
git remote add origin https://github.com/unixwin/unixwin.dev.git
git push -u origin main        # 若远端默认分支是 master，则 git push -u origin master
```

push 后 GitHub Actions（`.github/workflows/build.yml`）会自动执行
`npm ci && npm run build` 校验。

## License

MIT — 见 [LICENSE](./LICENSE)。
