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

## Agent 图标（public/assets/agents/，2026-10-21 扩编时加入）

`/agents/` 与 `/en/agents/` 目录卡片使用下列第三方图标，全部**本地化存储、不热链**，
仅用于标识对应产品（ nominative use ）；各图形与名称是其所有者的商标。卡片上统一垫
白色底板以保证暗色主题可读，未对图形本身做修改（仅 `<img>` 缩放）。

| 文件 | 来源 | 许可 / 依据 |
| --- | --- | --- |
| opencode / cursor / windsurf / trae / cline / gemini-cli / qwen-code / amp / junie(JetBrains) `.svg` | [Simple Icons](https://github.com/simple-icons/simple-icons)（cdn.simpleicons.org，按品牌名获取） | Simple Icons 项目 CC0；所描绘商标归各品牌所有 |
| claude-code `.svg` | Simple Icons（`claudecode`） | 同上 |
| codex `.svg` | Zed 仓库 `assets/icons/ai_open_ai.svg`（OpenAI 标记，仓库 MIT） | MIT（zed-industries/zed）；商标归 OpenAI |
| aider `.svg` | Aider 官网资产 `aider/website/assets/icons/brain.svg`（Aider-AI/aider，Apache-2.0） | Apache-2.0；商标归 Aider |
| goose `.svg` | block/goose `documentation/static/img/logo.svg`（Apache-2.0） | Apache-2.0；商标归 Block |
| continue `.svg` | continuedev/continue `docs/logo/light.svg`（Apache-2.0） | Apache-2.0；商标归 Continue |
| roo-code `.svg` | RooCodeInc/Roo-Code `src/assets/icons/icon.svg`（MIT） | MIT；商标归 Roo Code |
| kilo-code `.svg` | Kilo-Org/kilocode `packages/kilo-docs/public/favicon/favicon.svg`（Apache-2.0） | Apache-2.0；商标归 Kilo Code |
| openhands `.svg` | All-Hands-AI/OpenHands `public/favicon.svg`（MIT） | MIT；商标归 OpenHands |
| devin `.svg` | devin.ai 官方 favicon（SVG） | 商标归 Cognition Labs；标识性使用 |
| zed `.png` | zed-industries/zed `crates/zed/resources/app-icon.png`（仓库 GPL-3.0-or-later） | 标识性使用；商标归 Zed Industries |
| vs-code `.png` | microsoft/vscode `resources/linux/code.png`（仓库 MIT） | 标识性使用；商标归 Microsoft |
| kiro `.ico` | kiro.dev 官方 favicon | 标识性使用；商标归 AWS |
| amazon-q / zcode / dsh `.svg` | 本仓库自绘通用占位图形（`currentColor` 描边，无官方资产可用） | 本仓库 MIT；不代表官方图标 |
