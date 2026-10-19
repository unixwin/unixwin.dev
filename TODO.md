# TODO — unixwin.dev 门户交接清单

> 2026-10-19 · 交给负责视觉精修的同事 · 仓库 [unixwin/unixwin.dev](https://github.com/unixwin/unixwin.dev)
> 用户反馈：**当前界面不好看，已决定交给设计精修**。本文档 = 你需要知道的一切。

## 0. 五分钟上手（必读）

```bash
git clone https://github.com/unixwin/unixwin.dev && cd unixwin.dev
npm install                # 国内慢可加 --registry=https://registry.npmmirror.com
npm run dev                # 本地 http://localhost:4321
npm run build              # 出 dist/
```

- **必读 `PORTAL-CONVENTIONS.md`**（项目根）：架构硬约束全在里面。最重要的一条：**颜色只能出自 `src/styles/tokens.css` 的 token 变量，组件里禁止硬编码色值**；新增颜色必须三组主题（terminal/clean/neon）都给值。
- 三个候选首页在线上：`/`（A 终端）、`/theme/clean/`（B 亮色）、`/theme/neon/`（C 霓虹），右下角有 A/B/C 悬浮切换按钮。**基调尚未拍板**——你精修时三套都要照顾，或者推动先定一套。
- 数据管线：`npm run fetch:github` 从 GitHub 拉各仓库 CHANGELOG 与 star/版本号，生成 `src/data/changelogs.json` / `repo-meta.json`（**生成物，勿手改**）。`products.json` / `facts.json` 手工维护。
- 部署：构建产物进服务器 staging 后 `sudo bash /home/cmx/deploy-unixwin.sh`（nginx 8889 → Cloudflare Tunnel → unixwin.dev）。改完 push 到 main，GitHub Actions 会自动构建验证。

## 1. 事实性内容（已修正，review 时留意别改回去）

**⚠️ AI agent 自动探测的说法是敏感点。** 之前文案写"装好即被自动探测为默认 shell"——**这是错的**，已在三套首页修正（2026-10-19）。事实依据（来自 niubash 仓库 `docs/src/agents.md`，线上版 https://unixwin.github.io/niubash/agents.html ）：

- 唯一"通常直接生效"的方式：**从 niu 会话内启动 agent**，niu 导出 `$SHELL`，遵循 POSIX 约定的 agent（opencode 等）直接采用；
- `$SHELL` **不持久化**：从开始菜单/资源管理器启动的 agent 拿不到它，回落到 `which("bash")`——有 WSL 的机器会静默把命令跑进 Linux bash；
- Known traps：MSYSTEM 在 niu 会话为空；shim 的 `uname` 报 `MSYS_NT-*`；Claude Code 的 `CLAUDE_CODE_GIT_BASH_PATH` 只认 `bash.exe/sh.exe/bash/sh`；
- 各家机制不同：Codex 读自身 shell_detect、Cursor 的 `detectShellType()` 优先 pwsh、Gemini CLI 靠 MSYSTEM 嗅探（对 niu 无效）等。

→ **改文案时守住这条线**："从 niu 会话启动 → 直接生效；外部启动 → 按文档配置"，不要写"自动探测、无需配置"。

其它待核对：InstallTabs 里的 `wpm install winuxcmd` 命令为占位，需官方核实（wpm 随 WinuxCmd 内置，实际入口可能只是 `wpm update winuxcmd`）。

## 2. 视觉精修（用户反馈"不好看"——主要工作量在这里）

诚实评估：当前三套是"工程师级"成品——结构、数据、性能、无障碍都到位，但美术刻意保守。具体短板：

**全局**
- [ ] 字体：只用系统字体栈。考虑引入品牌字体（英文等宽如 JetBrains Mono / Berkeley Mono；中文可思源黑体/宋子集化），自托管 + `font-display: swap`，控制体积
- [ ] 产品 icon 系统：六产品无 logo（rubash 全仓无任何品牌资产），目前靠色块字符撑。需要设计 6 个统一风格的 icon（terminal 线条风优先，可先出占位套）
- [ ] `public/og-image.png` 与 `favicon.svg` 是程序生成过渡版，需设计稿替换（og 1200×630）
- [ ] 间距节奏单一（全局 1.1rem gap 的卡片网格缺乏大小对比）；section 之间缺呼吸感和视觉锚点
- [ ] 移动端只是"能用"：hero 终端窗口小屏溢出风险、产品卡双列断点、FAQ 折叠手感
- [ ] 滚动体验：无任何 scroll-driven 表现（导航吸顶已有，可加 scroll progress / section 进入动画，注意 `prefers-reduced-motion`）

**A 终端（/）**
- [ ] hero 靠文字排版撑场，boot log 是静态的——可做真打字机效果（原生 JS，注意 SEO 保留静态文本）
- [ ] `niubash-banner.svg` 是仓库原始资产（ASCII 风格 103KB），与页面气质是否统一存疑，考虑重绘或替换为真实终端录屏
- [ ] CRT 扫描线太淡几乎不可见——要么加强要么去掉
- [ ] "主题候选"区块（页尾三瓦片）与右下悬浮按钮重复，定调后一起摘

**B 亮色（/theme/clean/）**
- [ ] "通用 SaaS 模板感"最强：白底+蓝无品牌识别度，缺一处让人记住的视觉（品牌绿点缀？终端元素以亮色形式回归？）
- [ ] 六张产品卡完全同构，无主次——建议 niubash 大卡（旗舰）+ 其余小卡的层级
- [ ] FAQ 的 `<details>` 无展开动效，"+"指示器弱

**C 霓虹（/theme/neon/）**
- [ ] 玻璃+渐变容易显"模板感"，需要独特元素救场（如 ASCII art 大字、glitch 效果的产品名）
- [ ] 深底上的 muted 文字对比度需按 WCAG AA 复核
- [ ] 光斑动画 8s 偏慢偏弱，入场无动画

**可用现成素材**
- niubash 品牌资产：`~/unixwin-repos/niubash/assets/`（banner.svg / icon 256 / social-preview.png）；服务器旧站 `~/niubash-site-dist/`（demo*.gif 录屏、promo*.mp4、promo-poster.jpg——gif 已用 demo-gitbash.gif，其余未用）
- 设计自由度：**可以推翻视觉方案**，但请保住 PORTAL-CONVENTIONS.md 的架构（tokens 体系、组件数据流、三页信息架构对齐）；如果只想精修一套，先推动定调再动手

## 3. P1 功能（定调后启动，设计可先行出稿）

- [ ] **主题烘焙**：定 A/B/C（或混搭）后——中标主题设为全站默认 `data-theme`、摘除 `ThemeSwitcher` 与"主题候选"区块、其余两套路由删除或 302
- [ ] **六产品页** `/products/<id>/`：统一模板（Hero / Why / 特性 / 安装 / 高级特性 / AI 集成 / 性能证据 / changelog），素材直接取自 `~/unixwin-repos/<repo>/` 各 README 与 DOCS
- [ ] **/ai/ 集成中心**：蓝本 = niubash `docs/src/agents.md`（四机制表 + per-agent 配置卡 + Known traps 诚实呈现 + "从 niu 会话启动"首屏演示）；配套官网 `/agents.md`
- [ ] **/download/**：平台 tab + 版本号构建期注入 + 中国镜像（gh.caomengxuan666.com）写进命令 + sha256 折叠表
- [ ] **中英双语**：`/en/` 路由成对（沿用旧站 sessionStorage 语言探测方案）
- [ ] 搜索引擎收录：百度/谷歌/必应验证文件放 `public/`（域名已 Active）；开 Cloudflare Web Analytics
- [ ] llms.txt 扩充为 v2 完整版 + `/llms-full.txt`

## 4. 环境备忘

- 服务器：`/home/cmx/unixwin-portal`（同仓库）；部署 `sudo bash /home/cmx/deploy-unixwin.sh`；占位页备份在 `~/unixwin-site-staging-placeholder/`
- CI：push 到 main 自动构建（.github/workflows/build.yml），改完看 Actions 绿勾
- 本文档由 ZCode 生成于 P0 交付时；完成后请勾选/删除对应条目并提交

## 5. 2026-10-19 追加：Agents 目录 + 基准页（已构建推送，staging 待部署）

已上线页面：`/agents/`（卡片目录 + 9 个 agent 详情页，每页含换壳脚本/验证/回滚/坑/来源）与 `/benchmarks/`（fork 专项 2026-10-18 复测 + 启动延迟表，数据驱动 `src/data/agents.json` / `src/data/benchmarks.json`）。

**待对方 agent 回传材料后校准（dump 目录：服务器 /home/cmx/inbound/unixwin-dump-20261019/）：**
- [ ] 「全平台零 fork」的准确表述（三层执行模型：哪些操作不 fork、外部命令边界如何、三平台各自实现）→ 上首页 hero 与基准页标题
- [ ] 最新基准产物入库（recheck_fork_*.tsv、nvm）→ data/bench/，基准页来源指向仓库文件
- [ ] FACTS.json 权威数字裁决（命令数/测试数/套件率/版本，README 三处不一致）
- [ ] 内联 coreutils 完整名单（现在页面只举例 mkdir/touch/cat/sed/grep/wc）

**侧边栏决策（调研结论：nuxt.com/nodejs.org 先例）**：营销页无栏 + 内容页侧栏；自写 Sidebar.astro/SidebarGroup/SidebarLink/TocRight/DocsLayout 五件套，nav.json 升级为树形；暂不上 Starlight（整站迁移成本 > 收益，50+ 文档页后再议）。

## 6. 2026-10-19 材料包校准（portal-dump 分支，已完成）

- 基准页重写：会话截图的 fork 套件数字按 FACTS 纪律**撤下**（recheck_fork_*.tsv 全盘未找到，待落盘后回填 benchmarks.json.retracted 位）；改上有档数字：启动 27–48 vs 60–93 vs 202–278ms（startup.tsv）、Windows 同场 8/8 领先（results.tsv，min-of-3 已核算）、提示符 git 税 ≤29 vs 113–362ms、体积 16MB vs 440MB+20MB（GITBASH-KILLER）
- 首页 Why 扩为六卡：+零 fork、+路径方言全收（PATH-MATRIX）、+无 MSYS 咒语（GITBASH-KILLER 面1）；facts.json 换 FACTS 口径（options 1,924、一次性执行 26.3ms、单测 rubash 698/niubash 1026）
- BENCH/ 15 份产物原样入库 data/bench/（含 BENCH-README 环境/方法）
- README 侧待修（FACTS 记录，非门户阻塞）：rubash 40+→62、WinuxCmd 84→67、组织描述 75-100→45-103；wpm-gui 已评估归档
- CARDS.md 牌组 28 张仅用 6 张，P1 产品页/对比页继续取材
