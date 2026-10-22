import type { APIRoute } from 'astro';

/**
 * /agents.md — 构建期生成的 text/markdown 端点。
 * /ai/（src/pages/ai/index.astro）的纯 markdown 机器版：给 AI agent 直接读取。
 * 大纲：H1 → 一键安装提示词 → skill install 命令 → 四机制速查表 →
 *       验证命令与期望输出 → 已知陷阱四条 → 相关链接。
 * 与 /ai/ 共用的提示词文本保持逐字一致；事实来源：niubash 仓库
 * docs/src/agents.md（四机制/验证/陷阱）与 docs/src/advanced-usage.md
 * 「AI Agent Skill Bundle」（skill install 旗标）。
 */
const installPrompt = [
  '请把这台 Windows 机器上你（AI agent）执行命令所用的 shell 换成 niubash——Windows 原生的 bash 实现，无 WSL、无 MSYS。按顺序执行并汇报：',
  '',
  '1. 安装 niubash：在 PowerShell 中执行',
  '   winget install --id Unixwin.Niubash --source winget  (or: irm https://unixwin.dev/install.ps1 | iex)',
  '2. 把你自己的执行 shell 指到 niu：读 https://unixwin.github.io/niubash/agents.html 的',
  '   「The four mechanisms」一节，判断你属于哪种探测机制（1 = $SHELL 环境变量；',
  '   2 = agent 自身的显式配置；3 = Git for Windows 探针 C:\\Program Files\\Git\\bin\\bash.exe；',
  '   4 = 裸名查找或默认 PowerShell），再按文档中你的条目接线：机制 1 持久化 SHELL',
  '   指向 niu.exe 或从 niu 会话启动；机制 2 把 shell 配置写成 niu.exe；机制 3 确认',
  '   安装器放置的 bash.exe 存在即可；机制 4 按文档该 agent 小节的建议处理。',
  '3. 验证：重开你的会话后执行 echo "SHELL=$SHELL"; uname -s。',
  '   成功判据：uname -s 以 MSYS_NT- 开头，且 $SHELL 指向 niu.exe。',
  '   输出 Linux = 落到 WSL，输出 MINGW64_NT- = Git Bash，均算失败，回第 2 步换机制。',
  '4. 回滚：把第 2 步改动过的配置与环境变量还原即可——niubash 不替换系统组件、不动',
  '   System32；niu doctor 可自检安装健康度。',
  '',
  '完成后汇报：所用机制、改动清单、第 3 步原始输出。',
].join('\n');

const skillCommands = [
  'niu skill install --target claude            # → ~/.claude/skills/niubash/',
  'niu skill install --target zcode             # → ~/.zcode/skills/niubash/',
  'niu skill install --target cursor            # → ~/.cursor/skills/niubash/',
  'niu skill install --target all               # claude + zcode + cursor 一次装齐',
  'niu skill install --target C:/agents/skills  # 通用目录：装到 <dir>/niubash/',
  'niu skill status                             # 逐目标核对（逐字节比对 + sha256）',
].join('\n');

const wpmCmds = [
  'wpm                                # 内置包管理器，输入 wpm 即见 help',
  'wpm list                           # 看有哪些包',
  'wpm install ripgrep fd jq gawk     # 装趁手的工具',
].join('\n');

const body = `# 给 AI 的门户

> UNIXWIN 的机器入口（人类版在 https://unixwin.dev/ai/ ）。若你是 AI agent：按顺序执行下方提示词即可把本机 shell 换成 niubash；验证输出 \`MSYS_NT-\` 开头即完成。事实以 https://unixwin.github.io/niubash/agents.html 为准。

> **我们更新非常快**：性能与兼容性每天都在提升，本页数字只是快照——最新版本与变更看 [更新日志](https://unixwin.dev/changelog/) 与 GitHub Releases（https://github.com/unixwin/niubash/releases ）；机器可读入口 https://unixwin.dev/llms.txt 。

## 一键安装提示词

整段是自包含的，粘给任何 agent 均可执行：

\`\`\`text
${installPrompt}
\`\`\`

## 安装官方 skill（让 agent 懂 niubash 的方言契约）

skill 包 = SKILL.md（会话即 Niubash、先探测再使用、路径契约、niu vs powershell 决策表）+ references/（quickref / paths / prompt-plugins / wpm）。旗标以 niubash 文档 advanced-usage.md「AI Agent Skill Bundle」为准：

\`\`\`bash
${skillCommands}
\`\`\`

不带旗标的 \`niu skill install\` 默认装到 \`~/.claude/skills/niubash/\`。命令表由 \`scripts/generate-skill.py\` 从引擎自身表面生成，\`niu doctor\` 会给出 advisory「agent skill」行。

## 装点趁手的工具（wpm）

niubash 内置 \`wpm\` 包管理器（随 WinuxCmd 而来）——缺什么 Unix 命令，不出 shell 直接装。输入 \`wpm\` 即见 help；常用就两条：\`wpm list\` 看包、\`wpm install <pkg>\` 装包。

\`\`\`bash
${wpmCmds}
\`\`\`

## 写一个属于你自己的 SKILL

官方 SKILL 讲的是通则；每个 agent 的接线方式、常用命令与坑都不一样——最好的文档是你为自己总结的那份。按四步走：

1. 先读 https://unixwin.github.io/niubash/agents.html 与本页（https://unixwin.dev/agents.md ），弄清四机制与验证判据。
2. 实际用起来：完成安装与验证，\`wpm\` 装一两个趁手工具，再跑一段你自己的常用脚本。
3. 参考官方 SKILL（\`niu skill install\` 装的那份）的结构，**自己总结一份适用于自身工作流的 SKILL**——因地制宜：记录你自己的接线机制、常用命令、踩过的坑、验证方法。
4. 存到你自己的 skills 目录；愿意的话把成果提 PR 回馈 https://github.com/unixwin/unixwin.dev 。

## 四机制速查表

agent 在 Windows 上怎么挑 shell——先判断你读的是哪种机制，再接线（来源：agents.md「The four mechanisms」）：

| # | 机制 | 读什么 | 从 niu 会话启动即可覆盖 |
|---|------|--------|------------------------|
| 1 | \`$SHELL\`（POSIX 约定） | 环境变量 | 是 |
| 2 | agent 显式配置 | 配置文件 / CLI 旗标 | 不适用，设一次即可 |
| 3 | Git for Windows 探针 | 硬编码路径，或从 \`git\` 位置推导 | 否 |
| 4 | 裸名 / shell 表 / 默认 PowerShell | \`PATH\`、\`ComSpec\`、\`PATHEXT\` | 部分 |

## 验证命令与期望输出

\`\`\`bash
echo "SHELL=$SHELL"; uname -s; uname -a
\`\`\`

| 你看到的 | 实际 shell | 说明 |
|----------|-----------|------|
| \`uname -s\` = \`MSYS_NT-…\`，\`uname -a\` 结尾 \`x86_64 Msys\` | **niu**（winuxcmd shim） | 目标状态；\`$SHELL\` 指向 niu.exe |
| \`uname -s\` = \`MINGW64_NT-…\`，\`MSYSTEM=MINGW64\` | Git Bash | 想换 niu 则走机制 2 或 \`$SHELL\` |
| \`uname -s\` = \`Linux\` | **WSL** | agent 回落到了 \`System32\\bash.exe\`——命令正跑在另一个 OS 上 |
| \`uname\` 不存在、\`$SHELL\` 为空 | PowerShell 或 cmd | 安全但非 bash 兼容 |

## 已知陷阱

- \`MSYSTEM\` 在 niu 会话中为空——靠它嗅探 MSYS 的工具（如 Gemini CLI 的提案修法）看不到 niu。
- winuxcmd shim 的 \`uname\` 报 \`MSYS_NT-…\`（有意为兼容）——按 \`uname\` 分支的工具会把宿主判成 MSYS。
- Claude Code 的 \`CLAUDE_CODE_GIT_BASH_PATH\` 只接受名为 \`bash.exe\`/\`sh.exe\`/\`bash\`/\`sh\` 的文件——指到 \`git-bash.exe\` 或 \`niu.exe\` 会被忽略并告警。
- 解析到 \`C:\\Windows\\System32\\bash.exe\` 的裸名 \`bash\` 是 WSL 启动器，命令无声跑进 Linux，没有任何报错；裸名交给 CreateProcess 时系统目录先于用户 \`PATH\`，所以裸 \`bash\` 无法从用户 PATH 完全接管——完整答案是 Git 探针路径或改用 \`sh\`。

## 亮点速览

零 fork（\`( )\` 与 \`$( )\` 不建进程）· 四方言路径（\`C:\\\` / \`/d/\` / \`/mnt/d\` / \`/cygdrive/d\` 全收）· GNU 套件 83/83 全过 · git 启动 ~14ms · 3.79MB 单文件。数字细节见 [基准页](https://unixwin.dev/benchmarks/) 与 [文档](https://unixwin.dev/docs/)。

## 相关链接

- [llms.txt](https://unixwin.dev/llms.txt) — 站点索引（llmstxt 规范：Quick Start / 产品 / 文档）。
- [/agents/ 目录](https://unixwin.dev/agents/) — 逐家 agent 接入卡片与支持矩阵（含换壳脚本、验证、回滚）。
- [基准页](https://unixwin.dev/benchmarks/) — 启动延迟等基准；原生产物 15 份在 [data/bench/](https://github.com/unixwin/unixwin.dev/tree/main/data/bench)。
- [GitHub 组织](https://github.com/unixwin) — niubash、rubash、winuxcmd 等源码仓库。
- [机制事实来源](https://unixwin.github.io/niubash/agents.html) — niubash 仓库 docs/src/agents.md（2026-10-16 校准）。
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
