# Third-Party Notices

本仓库自身以 MIT 许可发布（见 LICENSE.md）。以下为借用的第三方素材及其许可信息。

## AstroWind

- 项目：<https://github.com/onwidget/astrowind>
- 许可：MIT License — © 2023 onWidget（原文见仓库 LICENSE 文件：
  <https://github.com/onwidget/astrowind/blob/main/LICENSE>）
- 用途（均为改编，非逐字复制）：
  1. **day / night 主题配色**：`src/styles/tokens.css` 中 `[data-theme="day"]` 与
     `[data-theme="night"]` 两组设计变量的亮/暗双档思路与取色改编自 AstroWind 的
     `src/components/CustomStyles.astro`（`--aw-color-*` 亮暗两套 tokens）及
     Starlight 的 slate 中性灰阶参考。
  2. **暗色切换**：`src/components/BaseLayout.astro` `<head>` 内的防 FOUC 内联脚本
     （读 localStorage → prefers-color-scheme → 设置 `data-theme`）改编自 AstroWind 的
     `src/components/common/ApplyColorMode.astro`；
     `src/components/ToggleTheme.astro`（圆形日/月切换按钮）改编自
     `src/components/common/ToggleTheme.astro`（去除 astro-icon 依赖，改为内联 SVG，
     `.dark` class 机制改为本项目 `data-theme` 属性）。

  适配改动：变量命名对齐本站 tokens 体系（`--bg/--text/--accent/...`）、切换仅限
  day↔night 两态、localStorage 键为 `unixwin-theme`、静态站无客户端路由故未移植
  `astro:after-swap` 监听。

## Fraunces

- 项目：<https://fonts.google.com/specimen/Fraunces>（仓库：
  <https://github.com/undercasetype/Fraunces>）
- 许可：SIL Open Font License 1.1
- 用途：`public/fonts/fraunces-latin-wght-{normal,italic}.woff2`——Google Fonts
  官方 latin 子集可变字体（未修改），经 `@font-face`（`src/styles/global.css`）
  自托管，作为 day/night 主题 `--font-display` 衬线展示字体。
  设计基因参考站：archify.si（其 `/fonts/fonts.css` 同源分发文件）。
