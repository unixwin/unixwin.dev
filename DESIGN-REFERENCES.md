# DESIGN-REFERENCES — unixwin.dev 设计参考册（供过目）

> 2026-10-19 · 三路子代理实访 24 个站点/资源后的汇总。用法：逐个点开 URL 过目，勾选喜欢的方向与案例，交设计执行。
> 结论先行：**推荐方向 D「专业终端」（见文末）**——以现有候选 A 为底，融合 cli.github.com 的 hero 交互终端、bun/oxc 的数字三件套、nuxt/oxc 的首页产品卡分流。

## 一、终端美学方向（对应候选 A 的进化目标）

| 案例 | URL | 气质 | 抄什么 | 适配度 |
|---|---|---|---|---|
| **GitHub CLI** ⭐Top1 | https://cli.github.com | 克制自信，show don't tell | hero 中央可交互终端窗口轮播真实命令；✓/×/● 状态字符做语义视觉；大 sans 标题 + mono 演示分层 | 高 |
| **Warp (Factory)** | https://www.warp.dev | 工程化暗色 AI 基建 | "活的"任务网格（▩ + 状态色 + ticker）；带行号的 yaml/目录树做视觉主体；curl 安装条三平台切换 | 高 |
| **Starship** | https://starship.rs | 极简跨 shell 提示符 | 深底单 accent 克制配色；带 shell 标签的安装代码块；紧凑 hero 不堆装饰 | 高 |
| Hyper | https://hyper.is | 性冷淡下载页 | 单屏 hero + 大 Download + 平台切换；配置片段当展示 | 中 |
| Terminal Industries | https://www.awwwards.com/sites/terminal-industries | Awwwards SOTD 滚动叙事 | 滚动分镜叙事；滚动数字里程表 | 中（学结构不学皮） |
| terminal.shop | https://www.terminal.shop | 整站伪装 shell | ssh 命令做主 CTA 的胆量 | 中（局部借用） |
| ohmyz.sh | https://ohmyz.sh | 社区玩梗 | 超大 tagline + 双安装命令 | 中低（俏皮与专业定位相悖） |
| kitty | https://sw.kovidgoyal.net/kitty/ | 纯文档 | 视频代替截图展示终端 | 低 |

**终端美学五法则**（做/避）：
1. 做"真实可跑"的终端演示（真命令真输出）；避 Matrix 雨、假 hacking 滚屏
2. 等宽字体承担命令/输出/标签，主标题可用几何 sans 分层；避全站 mono 窒息
3. 近黑底 + 单一荧光 accent + 语义状态色；避彩虹高亮（立刻变玩具）
4. 终端 chrome（红黄绿点、$、标题栏）做点缀层；避整站伪装终端
5. 用信息密度与真实细节（行号、退出码、耗时）造专业感；扫描线是香料不是主菜

## 二、dev-tool 矩阵门户方向（多产品组织形态）

| 案例 | URL | 抄什么 | 适配度 |
|---|---|---|---|
| **Nuxt** | https://nuxt.com | 导航即目录；首页 12 张模块卡带下载量/star/一键复制安装命令/Official 徽章 | 高 |
| **Oxc** | https://oxc.rs | "A collection of …"定位词；六工具卡按成熟度标 Alpha/Beta；基准条形图标注硬件 | 高 |
| **Bun** | https://bun.sh | hero 即安装命令 + 版本 pill；基准条形图可 replay；每图配 medians-of-3 + 复现仓库 + 无障碍表格兜底 | 高 |
| Vite | https://vite.dev | 生态 logo 墙替代自夸；版本下拉 + 多语言 | 中高 |
| rolldown | https://rolldown.rs | 基准排名列表（40.10s vs 1.61s 落差自证） | 中 |
| Tailwind | https://tailwindcss.com | 商业层收进一个入口的克制 | 中 |
| Linear | https://linear.app | 排版纪律天花板；mega-menu 分组 | 中 |
| Vercel | https://vercel.com | 黑白极简与分组纪律 | 中低（SaaS 感重） |

**两条最佳实践结论**：
- **多产品导航 = 双轨制**：首页产品卡矩阵做主分流（nuxt/oxc 式，每卡一行价值 + 安装命令 + 成熟度徽章），顶部 Products 收拢入口（4+ 产品时）。
- **性能数字三件套**：口号化倍数（记忆）+ 可复现条形图（信任）+ 真实场景负载（共情）；数字具体到小数、标注硬件、给复现入口——可信度装置比倍数本身更打动开发者。

## 三、设计技法包（SKILL）

- **字体**：JetBrains Mono（OFL 免费，fontsource 自托管 woff2）为主 + 思源黑体子集（cn-font-split 分包）+ `ui-monospace` 兜底；备选 Geist Mono / Commit Mono / IBM Plex Mono；Berkeley Mono 付费 $75 无必要
- **背景纹理**：Heropatterns 网格款（https://heropatterns.com）+ repeating-linear-gradient 细扫描线（hero 1px/3px）
- **CSS 技法**：CRT 扫描线拆解 https://aleclownes.com/2017/02/01/crt-display.html ；荧光 glow https://codepen.io/tag/neon ；纯 CSS 打字机 https://codepen.io/denic/pen/GRoOxbM 与 https://dev.to/afif/a-scalable-css-only-typewriter-effect-2opn
- **动效选型**（静态站优先纯 CSS）：CSS scroll-driven animations（https://scroll-driven-animations.style ，Chrome/Safari 已支持）；不足再 motion.dev 单点 island；GSAP 已全免费但仅在需时间线编排时用
- **图标**：lucide.dev（ISC，配 astro-icon 内联）+ simple-icons.com（品牌标）
- **字体工程参考**：https://www.zachleat.com/web/comprehensive-webfonts/

## 四、案例画廊（自己逛）

| 画廊 | 直达筛 | 说明 |
|---|---|---|
| saaslandingpage | https://saaslandingpage.com/tag/devtools/ + /tag/dark/ | 最贴题，840+，devtools 专列 |
| dark.design | https://dark.design/ | 深色专馆，Software 类即终端风精选 |
| Awwwards | https://www.awwwards.com/websites/dark/ | 质量最高，量大 |
| recent.design（原 godly） | https://recent.design/ | 质量极高，无 dark 专筛 |
| land-book | https://land-book.com/ | Style 筛 Dark Colors |
| lapa.ninja | https://lapa.ninja/ | 侧栏 Dark 筛选 |

## 五、推荐：方向 D「专业终端」（Terminal Professional）

在候选 A（terminal）基础上做四次升级，不做推倒重来：

1. **Hero 换成 cli.github.com 式交互终端**：中央终端窗口轮播真实会话（现有 Agent 一瞥的内容升级进 hero：`$ niu` → boot → agent 接管），打字机用纯 CSS 方案
2. **首页产品卡加"安装命令 + 成熟度徽章"**（nuxt/oxc 式）：六产品卡每张带一行 `wpm install …`/复制按钮 + stable/beta 徽章
3. **基准三件套落位**（bun/oxc 式）：hero 下数字带 → /benchmarks/ 条形图（已有）→ 每图注硬件与复现入口（data/bench/ 已入库）
4. **字体与质感**：JetBrains Mono 自托管 + 思源黑体子集；hero 细扫描线 + 单一荧光绿；状态字符 ✓/×/● 进组件系统

保留 B（clean）作为第二落点（文档/下载页用亮色更舒服），C（neon）可退役或留作活动页皮肤。

**过目清单（最少点这 5 个）**：cli.github.com → warp.dev → starship.rs → oxc.rs → bun.sh
