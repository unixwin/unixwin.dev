import type { APIRoute } from 'astro';

/**
 * /agents.md — 构建期生成的 text/markdown 端点。
 * /ai/（src/pages/ai/index.astro）的纯 markdown 机器版：给 AI agent 直接读取。
 * 双语对照：每个段落先英文、后中文（中文为事实原文，英文为对照译）；
 * 大纲：H1 → 一键安装提示词 → skill install 命令 → 四机制速查表 →
 *       验证命令与期望输出 → 已知陷阱四条 → 相关链接。
 * 提示词文本与 /ai/ 共用口径；事实来源：niubash 仓库
 * docs/src/agents.md（四机制/验证/陷阱）与 docs/src/advanced-usage.md
 * 「AI Agent Skill Bundle」（skill install 旗标）。
 */
const installPromptEn = [
  'Switch the shell that you (the AI agent) use to run commands on this Windows machine to niubash — the native bash implementation for Windows, no WSL, no MSYS. Execute the steps in order and report back:',
  '',
  '1. Install niubash: in PowerShell, run',
  '   winget install --id Unixwin.Niubash --source winget  (or: irm https://unixwin.dev/install.ps1 | iex)',
  '2. Point your own execution shell at niu: read the "The four mechanisms" section of',
  '   https://unixwin.github.io/niubash/agents.html and work out which detection mechanism you use',
  '   (1 = the $SHELL environment variable; 2 = your own explicit configuration;',
  '   3 = the Git for Windows probe at C:\\Program Files\\Git\\bin\\bash.exe;',
  '   4 = bare-name lookup or a default PowerShell), then wire accordingly:',
  '   mechanism 1: persist SHELL pointing at niu.exe or launch from a niu session;',
  '   mechanism 2: write your shell configuration as niu.exe;',
  '   mechanism 3: just confirm the installer-placed bash.exe exists;',
  '   mechanism 4: follow the advice in your entry of that document.',
  '3. Verify: after reopening your session, run echo "SHELL=$SHELL"; uname -s.',
  '   Success: uname -s starts with MSYS_NT- and $SHELL points at niu.exe.',
  '   Output Linux = you fell into WSL; output MINGW64_NT- = Git Bash. Both are failures — go back',
  '   to step 2 and switch mechanisms.',
  '4. Rollback: revert whatever configuration and environment variables step 2 changed — niubash',
  '   replaces no system components and never touches System32; niu doctor self-checks install health.',
  '',
  'When finished, report: the mechanism used, the list of changes, and the raw output of step 3.',
].join('\n');

const installPromptZh = [
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
  'niu skill install --target all               # claude + zcode + cursor in one run',
  'niu skill install --target C:/agents/skills  # generic directory: lands in <dir>/niubash/',
  'niu skill status                             # verify every target (byte-compare + sha256)',
].join('\n');

const wpmCmds = [
  'wpm                                # built-in package manager; typing wpm prints help',
  'wpm list                           # see which packages exist',
  'wpm install ripgrep fd jq gawk     # install the handy tools',
].join('\n');

const body = `# The Portal for AI（给 AI 的门户）

> The machine-facing entry of UNIXWIN (human version: https://unixwin.dev/ai/ ，中文人类版）。If you are an AI agent: run the prompt below in order and this machine's shell becomes niubash; a verify output starting with \`MSYS_NT-\` means done. Facts are governed by https://unixwin.github.io/niubash/agents.html 。若你是 AI agent：按顺序执行下方提示词即可把本机 shell 换成 niubash；验证输出 \`MSYS_NT-\` 开头即完成。事实以 https://unixwin.github.io/niubash/agents.html 为准。

> **We iterate very fast** (中文对照：**我们更新非常快**)：performance and compatibility improve daily; numbers on this page are a snapshot — for the latest version and changes see the [changelog](https://unixwin.dev/en/changelog/)（[更新日志](https://unixwin.dev/changelog/)） and GitHub Releases (https://github.com/unixwin/niubash/releases); machine-readable index: https://unixwin.dev/llms.txt （机器可读入口 https://unixwin.dev/llms.txt ）。

## One-click install prompt（一键安装提示词）

The English prompt below is self-contained — paste it into any agent (中文版提示词同样自包含，二选一即可；the Chinese prompt further below works identically):

\`\`\`text
${installPromptEn}
\`\`\`

中文版提示词（与上方英文版同义，任选其一粘贴给 agent）：

\`\`\`text
${installPromptZh}
\`\`\`

## Install the official skill (let the agent know niubash's dialect contract)（安装官方 skill）

The skill bundle = SKILL.md ("the session is Niubash", probe before use, the path contract, the niu-vs-powershell decision table) + references/ (quickref / paths / prompt-plugins / wpm). Flags follow advanced-usage.md "AI Agent Skill Bundle"（skill 包 = SKILL.md + references/；旗标以 niubash 文档 advanced-usage.md 为准）:

\`\`\`bash
${skillCommands}
\`\`\`

\`niu skill install\` without a flag installs to \`~/.claude/skills/niubash/\` by default. The command table is generated by \`scripts/generate-skill.py\` from the engine's own surface, and \`niu doctor\` carries an advisory "agent skill" line（不带旗标默认装到 \`~/.claude/skills/niubash/\`；命令表由 \`scripts/generate-skill.py\` 从引擎自身表面生成，\`niu doctor\` 会给出 advisory「agent skill」行）.

## Install a few handy tools (wpm)（装点趁手的工具）

niubash ships the built-in \`wpm\` package manager (via WinuxCmd) — missing a Unix command? Install it without leaving the shell（niubash 内置 \`wpm\` 包管理器——缺什么 Unix 命令，不出 shell 直接装）. Typing \`wpm\` prints help; the two common moves are \`wpm list\` and \`wpm install <pkg>\`:

\`\`\`bash
${wpmCmds}
\`\`\`

## Write a SKILL of your own（写一个属于你自己的 SKILL）

The official SKILL teaches the general rules; every agent's wiring, favorite commands and pitfalls differ — the best documentation is the one you write for yourself. Four steps（官方 SKILL 讲的是通则；最好的文档是你为自己总结的那份。按四步走）:

1. First read https://unixwin.github.io/niubash/agents.html and this page (https://unixwin.dev/agents.md) to get the four mechanisms and the verify criteria（先读两文，弄清四机制与验证判据）.
2. Actually use it: finish install + verify, install a couple of tools with \`wpm\`, then run one of your own everyday scripts（实际用起来：完成安装与验证，\`wpm\` 装一两个趁手工具，再跑一段常用脚本）.
3. Model your own SKILL on the official one's structure — adapted to your workflow: your wiring mechanism, common commands, pitfalls hit, how you verify（参考官方 SKILL 的结构，自己总结一份适用于自身工作流的 SKILL——记录接线机制、常用命令、踩过的坑、验证方法）.
4. Store it in your own skills directory; PR your findings back to https://github.com/unixwin/unixwin.dev if you like（存到你自己的 skills 目录；愿意的话提 PR 回馈）.

## Four mechanisms at a glance（四机制速查表）

How an agent picks a shell on Windows — decide which mechanism you read, then wire（agent 在 Windows 上怎么挑 shell——先判断你读的是哪种机制，再接线；来源：agents.md「The four mechanisms」）:

| # | Mechanism（机制） | What it reads（读什么） | Covered by launching from a niu session?（从 niu 会话启动即可覆盖） |
|---|------|--------|------------------------|
| 1 | \`$SHELL\` (POSIX convention) | environment variable（环境变量） | Yes（是） |
| 2 | explicit agent configuration（agent 显式配置） | config file / CLI flag（配置文件 / CLI 旗标） | N/A — set once（不适用，设一次即可） |
| 3 | Git for Windows probe（Git for Windows 探针） | hard-coded paths, or inferred from \`git\`（硬编码路径，或从 \`git\` 位置推导） | No（否） |
| 4 | bare name / shell table / default PowerShell（裸名 / shell 表 / 默认 PowerShell） | \`PATH\`, \`ComSpec\`, \`PATHEXT\` | Partial（部分） |

## Verify command and expected output（验证命令与期望输出）

\`\`\`bash
echo "SHELL=$SHELL"; uname -s; uname -a
\`\`\`

| You see（你看到的） | Actual shell（实际 shell） | Meaning（说明） |
|----------|-----------|------|
| \`uname -s\` = \`MSYS_NT-…\`, \`uname -a\` ends \`x86_64 Msys\` | **niu** (winuxcmd shim) | Target state; \`$SHELL\` points at niu.exe（目标状态；\`$SHELL\` 指向 niu.exe） |
| \`uname -s\` = \`MINGW64_NT-…\`, \`MSYSTEM=MINGW64\` | Git Bash | To switch to niu use mechanism 2 or \`$SHELL\`（想换 niu 则走机制 2 或 \`$SHELL\`） |
| \`uname -s\` = \`Linux\` | **WSL** | The agent fell back to \`System32\\bash.exe\` — commands are running on another OS（agent 回落到了 \`System32\\bash.exe\`——命令正跑在另一个 OS 上） |
| \`uname\` missing, \`$SHELL\` empty | PowerShell or cmd | Safe but not bash-compatible（安全但非 bash 兼容） |

## Known traps（已知陷阱）

- EN: \`MSYSTEM\` is empty inside a niu session — tools that sniff it to detect MSYS (e.g. the Gemini CLI proposal) cannot see niu.
  （中文：\`MSYSTEM\` 在 niu 会话中为空——靠它嗅探 MSYS 的工具（如 Gemini CLI 的提案修法）看不到 niu。）
- EN: the winuxcmd shim's \`uname\` reports \`MSYS_NT-…\` (deliberate compatibility) — tools branching on \`uname\` classify the host as MSYS.
  （中文：winuxcmd shim 的 \`uname\` 报 \`MSYS_NT-…\`（有意为兼容）——按 \`uname\` 分支的工具会把宿主判成 MSYS。）
- EN: Claude Code's \`CLAUDE_CODE_GIT_BASH_PATH\` only accepts files named \`bash.exe\`/\`sh.exe\`/\`bash\`/\`sh\` — pointing it at \`git-bash.exe\` or \`niu.exe\` is ignored with a warning.
  （中文：Claude Code 的 \`CLAUDE_CODE_GIT_BASH_PATH\` 只接受名为 \`bash.exe\`/\`sh.exe\`/\`bash\`/\`sh\` 的文件——指到 \`git-bash.exe\` 或 \`niu.exe\` 会被忽略并告警。）
- EN: a bare \`bash\` resolving to \`C:\\Windows\\System32\\bash.exe\` is the WSL launcher; commands silently run inside Linux with no error, and the system directory precedes the user \`PATH\` in CreateProcess's search order, so a bare \`bash\` cannot be fully taken over from a user PATH — the complete answer is the Git probe path or switching to \`sh\`.
  （中文：解析到 \`C:\\Windows\\System32\\bash.exe\` 的裸名 \`bash\` 是 WSL 启动器，命令无声跑进 Linux，没有任何报错；裸名交给 CreateProcess 时系统目录先于用户 \`PATH\`，所以裸 \`bash\` 无法从用户 PATH 完全接管——完整答案是 Git 探针路径或改用 \`sh\`。）

## Highlights at a glance（亮点速览）

Zero fork (\`( )\` and \`$( )\` create no process) · four path dialects (\`C:\\\` / \`/d/\` / \`/mnt/d\` / \`/cygdrive/d\` all accepted) · 83/83 GNU upstream suites pass · git startup ~14ms · one 3.79MB file. For the numbers see the [benchmarks](https://unixwin.dev/en/benchmarks/) and [docs](https://unixwin.dev/en/docs/)（数字细节见[基准页](https://unixwin.dev/benchmarks/)与[文档](https://unixwin.dev/docs/)）.

## Related links（相关链接）

- [llms.txt](https://unixwin.dev/llms.txt) — the site index (llmstxt spec: Quick Start / products / docs)（站点索引）.
- [/agents/ catalogue](https://unixwin.dev/en/agents/)（[/agents/ 目录](https://unixwin.dev/agents/)） — per-agent wiring cards and the support matrix (swap scripts, verify, rollback)（逐家 agent 接入卡片与支持矩阵）.
- [Benchmarks](https://unixwin.dev/en/benchmarks/)（[基准页](https://unixwin.dev/benchmarks/)） — startup latency and more; 15 raw native artifacts in [data/bench/](https://github.com/unixwin/unixwin.dev/tree/main/data/bench).
- [GitHub organization](https://github.com/unixwin) — niubash, rubash, winuxcmd and the other source repos（GitHub 组织：niubash、rubash、winuxcmd 等源码仓库）.
- [Mechanism source of truth](https://unixwin.github.io/niubash/agents.html) — the niubash repo's docs/src/agents.md (calibrated 2026-10-16)（机制事实来源）.
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
