/**
 * FAQ 题库（issue #13）——单一事实源：三个用途共用，
 *   1) 可见 FAQ 区块（FaqSection.astro 渲染）
 *   2) FAQPage JSON-LD（faqJsonLd()）
 *   3) /llms-full.txt 的 FAQ 节
 * 口径纪律：每个答案里的数字与 facts.json / benchmarks.json 同源，不得写无出处数字。
 */

export interface FaqItem {
  id: string;
  q: string;
  a: string;
  qEn: string;
  aEn: string;
}

export const faqItems: FaqItem[] = [
  {
    id: 'gitbash-diff',
    q: 'niubash 和 Git Bash / WSL 有什么区别？',
    a: 'niubash 是 Rust 写的原生 Windows 程序：不捆绑 MSYS 模拟层，也不需要 WSL 虚拟机。Git Bash 在 spawn 前会启发式改写「看起来像路径」的参数（这正是 MSYS_NO_PATHCONV 咒语存在的原因），niu 的 argv 逐字节原样抵达；安装后全家族约 16 MB，Git Bash 约 440 MB。',
    qEn: 'How is niubash different from Git Bash / WSL?',
    aEn: 'niubash is a native Windows program written in Rust: no bundled MSYS emulation layer, no WSL VM. Git Bash heuristically rewrites path-looking arguments before spawn (the reason the MSYS_NO_PATHCONV incantation exists); niu passes argv through byte-for-byte. The installed family is ≈16 MB versus Git Bash\'s ~440 MB.',
  },
  {
    id: 'no-wsl-msys',
    q: '用 niubash 需要装 WSL 或 MSYS 吗？',
    a: '不需要。bash 语义由 Rust 引擎 rubash 直接执行，Unix 命令由 WinuxCmd 原生提供（176+ 命令），Git 由 niu-git 原生提供——全部是原生二进制，零 DLL 依赖，shell 不含任何遥测。',
    qEn: 'Do I need WSL or MSYS to use niubash?',
    aEn: 'No. Bash semantics run directly on the Rust engine (rubash), Unix commands come from WinuxCmd (176+ commands), and Git from niu-git — all native binaries with zero DLL dependencies and zero telemetry in the shell.',
  },
  {
    id: 'what-is-83',
    q: '「83/83 GNU 套件」是什么意思？',
    a: 'GNU Bash 上游自带的 83 套测试语料在真机 Windows 上全部通过，其中 82 套输出与 GNU Bash 5.3 逐字节一致；唯一残差（nameref 1 行）被逐字节证明是 GNU 自身的 coproc 回收竞态。兼容性是测出来的：另有 2,686 个真实生态仓 / 9,701 个资产每夜巡检。',
    qEn: 'What does "83/83 GNU suites" mean?',
    aEn: 'All 83 upstream GNU Bash test suites pass on real hardware Windows, with 82 suites byte-identical to GNU Bash 5.3 output; the single residual line (nameref) is proven byte-by-byte to be GNU\'s own coproc reap race. Compatibility is measured, not claimed: a nightly patrol additionally sweeps 2,686 real-world ecosystem repos / 9,701 assets.',
  },
  {
    id: 'switch-agent',
    q: '怎么把 Claude Code / Cursor 等 agent 的 shell 切到 niubash？怎么回滚？',
    a: '打开 Agent 目录（/agents/）：24 个主流 agent 各有一页，含可复制的换壳脚本、真实验证命令（echo "SHELL=$SHELL"; uname -s）与回滚步骤。AI 用户也可以直接把 /ai/ 的安装提示词粘给 agent，由 agent 自己完成安装与接入。',
    qEn: 'How do I switch an agent\'s shell (Claude Code / Cursor etc.) to niubash, and how do I roll back?',
    aEn: 'Open the agent directory (/agents/): each of 24 mainstream agents has its own page with a copy-paste switch script, a real verify command (echo "SHELL=$SHELL"; uname -s) and rollback steps. AI users can also paste the install prompt from /ai/ and let the agent install and wire itself.',
  },
  {
    id: 'free-platforms',
    q: '免费吗？支持哪些平台？',
    a: '全部开源免费。niubash 提供 Windows x64 / arm64 原生安装包（winget：Unixwin.Niubash）；引擎 rubash 另有 Linux（gnu/musl）、macOS、Android 与 OpenHarmony 五平台的 CI 门禁构建。',
    qEn: 'Is it free? Which platforms are supported?',
    aEn: 'Everything is open source and free. niubash ships native Windows x64 / arm64 installers (winget: Unixwin.Niubash); the rubash engine additionally has CI-gated builds for five platforms: Linux (gnu/musl), macOS, Android and OpenHarmony.',
  },
  {
    id: 'perf',
    q: '性能怎么样？',
    a: '一次性执行（niu -c true）2026-10-28 统一口径复测 4.14ms（空跑 p50 3.71ms；GNU bash 5.3.20 为 2.67 / 2.60ms；Linux 同机 release）；niu-git 启动约 14ms（Git Bash 45–103ms）；命令替换与子壳类负载比 GNU bash 快 13–62x。全部数字附实测方法与复现产物，见「基准测试」（/benchmarks/）。',
    qEn: 'How is the performance?',
    aEn: 'One-shot execution (niu -c true) re-measured 2026-10-28 at 4.14 ms (bare run p50 3.71 ms; GNU bash 5.3.20 2.67 / 2.60 ms; Linux same-machine, release builds); niu-git starts in ~14 ms (Git Bash: 45–103 ms); command-substitution and subshell workloads run 13–62x faster than GNU bash. Every number ships with its measurement method and reproducible artifacts — see Benchmarks (/benchmarks/).',
  },
  {
    id: 'naming',
    q: 'niu 和 niubash 是什么关系？',
    a: 'niu 是 niubash 的可执行程序名（winget 安装后命令就叫 niu）。家族分工：引擎层 rubash（可嵌入的 Bash 5.3 兼容引擎）、命令层 WinuxCmd、Git 是 niu-git、包管理器是 wpm、主题框架是 oh-my-niu。',
    qEn: 'What is the relation between niu and niubash?',
    aEn: 'niu is the executable name of niubash (after winget install the command is niu). The family splits as: rubash (the embeddable Bash 5.3-compatible engine), WinuxCmd (Unix commands), niu-git (Git), wpm (package manager) and oh-my-niu (theme framework).',
  },

  // ---- 产品专属问答（issue #22：五张产品页 FAQ；事实口径对齐 facts.json/各仓 README）----
  {
    id: 'what-is-rubash',
    q: 'rubash 和 niubash 是什么关系？',
    a: 'rubash 是 niubash 的语言引擎——bash 语法由它执行；同时它可独立使用：已上架 crates.io（1.4.0，cargo add rubash），是一个可嵌入的 GNU Bash 5.3 兼容引擎。',
    qEn: 'What is the relation between rubash and niubash?',
    aEn: 'rubash is the language engine of niubash — it is what executes the bash syntax. It also stands alone: published on crates.io (1.4.0, cargo add rubash) as an embeddable GNU Bash 5.3-compatible engine.',
  },
  {
    id: 'embed-api',
    q: '怎么把 rubash 嵌入到自己的程序里？',
    a: 'cargo add rubash 即作依赖使用。稳定嵌入 API 与四层 workspace 拆分（core/driver/interactive/facade）是 1.5.0 的目标，设计稿已合并（PR rubash#814），846 处 env-IPC 将迁为 typed bridges。',
    qEn: 'How do I embed rubash in my own program?',
    aEn: 'cargo add rubash and use it as a library. The stable embedding API and the four-tier workspace split (core/driver/interactive/facade) target 1.5.0 — the design doc is merged (rubash#814), moving 846 env-IPC sites to typed bridges.',
  },
  {
    id: 'builtins-62',
    q: 'rubash 的内建命令覆盖多少？',
    a: 'GNU Bash 5.3 的 61 个内建全覆盖 + 扩展 env（62 个）；另有 12 个高频文件命令内联执行与管道内联臂——echo | cat 这类管道全程零进程创建。',
    qEn: 'How many builtins does rubash cover?',
    aEn: 'All 61 builtins of GNU Bash 5.3 plus the env extension (62); 12 high-frequency file commands execute inline with a pipeline inline arm — an echo | cat pipeline creates zero processes end to end.',
  },
  {
    id: 'winuxcmd-what',
    q: 'WinuxCmd 和 Git Bash 自带的 Unix 命令有什么区别？',
    a: 'WinuxCmd 是单个原生 Win32 可执行文件，携带 176 命令 / 1,924 选项（3.79 MB、零 DLL）；Git Bash 靠约 440 MB 的 MSYS 模拟层提供同类命令，且 spawn 前会改写「像路径」的参数——WinuxCmd 的 argv 逐字节原样抵达。',
    qEn: 'How does WinuxCmd differ from the Unix commands bundled with Git Bash?',
    aEn: 'WinuxCmd is a single native Win32 executable carrying 176 commands / 1,924 options (3.79 MB, zero DLLs). Git Bash provides similar commands through a ~440 MB MSYS emulation layer that rewrites path-looking arguments before spawn — WinuxCmd’s argv arrives byte-for-byte.',
  },
  {
    id: 'winuxcmd-perf',
    q: 'WinuxCmd 性能如何？',
    a: '约 19 ms 冷启动；PGO 构建下 sort 快 18%、nl 快 17%（README 实测口径）。',
    qEn: 'How fast is WinuxCmd?',
    aEn: 'About 19 ms cold start; with PGO builds sort is 18% faster and nl 17% (measured, per the README).',
  },
  {
    id: 'winuxcmd-diff',
    q: '「对 GNU 差分」是什么意思？',
    a: '每个 PR 自动对 GNU coreutils 9.7 跑 178 例差分语料（131 例覆盖 67 命令 + 47 例回归）：93% 通过，13 例平台差异实名在册——命令行为是被测出来的，不是宣称的。',
    qEn: 'What does "GNU differential" mean?',
    aEn: 'Every PR automatically runs a 178-case differential against GNU coreutils 9.7 (131 corpus cases over 67 commands + 47 regressions): 93% pass, with all 13 tracked platform differences named in the ledger — command behavior is measured, not claimed.',
  },
  {
    id: 'wpm-winuxcmd',
    q: 'wpm 和 WinuxCmd 是什么关系？',
    a: 'wpm 直接编译进 winuxcmd.exe（winuxcmd wpm 即用），零运行时依赖、无独立安装步骤。',
    qEn: 'How do wpm and WinuxCmd relate?',
    aEn: 'wpm is compiled straight into winuxcmd.exe (run as winuxcmd wpm) — zero runtime dependencies, no separate install step.',
  },
  {
    id: 'niugit-what',
    q: 'niu-git 和 Git for Windows 有什么区别？',
    a: '同一份 git-for-windows C 源码的 MSVC 原生构建：无 MSYS 层、无 OpenSSL（TLS 走 schannel + Windows 证书库）、不捆绑 shell/perl——launcher 引号按 Win32 文档行为对齐，零启发式。',
    qEn: 'How is niu-git different from Git for Windows?',
    aEn: 'The same git-for-windows C sources built natively with MSVC: no MSYS layer, no OpenSSL (TLS via schannel + the Windows cert store), no bundled shell/perl — launcher quoting follows the Win32 documentation with zero heuristics.',
  },
  {
    id: 'niugit-fast',
    q: 'niu-git 为什么快？',
    a: 'git 启动约 14 ms（Git Bash 实测 45–103 ms）；无 DLL 装载与 MSYS 初始化链，进程直接起步。',
    qEn: 'Why is niu-git fast?',
    aEn: 'git starts in about 14 ms (Git Bash measures 45–103 ms) — no DLL loading or MSYS init chain, the process starts directly.',
  },
  {
    id: 'niugit-install',
    q: 'niu-git 怎么安装？',
    a: '随 niubash 预装（x64 / arm64 双架构），装好即有：git --version 直接可用，并接受 POSIX 形 /d/... 参数。',
    qEn: 'How do I install niu-git?',
    aEn: 'It is preinstalled with niubash (x64 / arm64): git --version works out of the box, and POSIX-shaped /d/... arguments are accepted.',
  },
  {
    id: 'wpm-install',
    q: 'wpm 怎么安装？',
    a: '无需安装——编译进 winuxcmd.exe，装好 WinuxCmd/niubash 即有：wpm 打印帮助、wpm list 浏览索引、wpm install <pkg> 安装。',
    qEn: 'How do I install wpm?',
    aEn: 'Nothing to install — it is compiled into winuxcmd.exe, so having WinuxCmd/niubash means having wpm: wpm prints help, wpm list browses the index, wpm install <pkg> installs.',
  },
  {
    id: 'wpm-index',
    q: 'wpm 有多少包？安全吗？',
    a: '官方索引 281 包，每条带 sha256/size/urls 三元组；缓存键 <pkg>-<version>-<sha8> 双校验，索引脚本拒绝为缺文件的档写条目。',
    qEn: 'How many packages does wpm have? Is it safe?',
    aEn: 'The official index carries 281 packages, each with a sha256/size/urls triple; the cache key <pkg>-<version>-<sha8> double-checks, and the index tooling refuses to write entries for archives missing files.',
  },
  {
    id: 'wpm-mirror',
    q: 'wpm 国内下载快吗？',
    a: '四源镜像，gh.caomengxuan666.com 提供中国区加速；校验以 sha256 为准，镜像只加速不替换内容。',
    qEn: 'Is wpm fast to download from China?',
    aEn: 'Four mirror sources with gh.caomengxuan666.com accelerating China; sha256 remains the source of truth — mirrors accelerate, never substitute.',
  },
  {
    id: 'wpm-gui',
    q: 'wpm 有 GUI 吗？',
    a: '曾有 wpm-gui 实验，因 CLI 契约漂移已评估归档（wpm-gui#1）——当前专注把 CLI 做稳，JSON 输出（--json）面向脚本与 agent。',
    qEn: 'Does wpm have a GUI?',
    aEn: 'A wpm-gui experiment was evaluated and archived due to CLI contract drift (wpm-gui#1) — the focus is a stable CLI, with --json output for scripts and agents.',
  },
  {
    id: 'omn-enable',
    q: 'oh-my-niu 怎么启用？',
    a: 'rc 三行：NIU_PLUGINS=(prompt-core git …) 选插件、NIU_THEME=… 选主题、source "$NIUBASH/oh-my-niu.niu" 加载框架。框架随 niubash 发行，入口可重入（source 两次是空操作，--reload 全量重载）。',
    qEn: 'How do I enable oh-my-niu?',
    aEn: 'Three rc lines: NIU_PLUGINS=(prompt-core git …) picks plugins, NIU_THEME=… picks the theme, source "$NIUBASH/oh-my-niu.niu" loads the framework. It ships with niubash; the entry is re-entrant (sourcing twice is a no-op, --reload forces a full reload).',
  },
  {
    id: 'omn-theme',
    q: 'oh-my-niu 怎么换主题？',
    a: '改 NIU_THEME 后重开终端即可；当前会话可 source "$NIUBASH/oh-my-niu.niu" --reload 热重载。27 款主题每一款都是普通插件目录，没有特殊的「主题系统」。',
    qEn: 'How do I change themes in oh-my-niu?',
    aEn: 'Edit NIU_THEME and reopen the terminal; the current session can hot-reload with source "$NIUBASH/oh-my-niu.niu" --reload. Each of the 27 themes is an ordinary plugin directory — there is no special "theme system".',
  },
  {
    id: 'omn-osh',
    q: '能跑 oh-my-bash 的主题和插件吗？',
    a: '能——niu plugin add oh-my-bash（catalog 直指官方上游仓），上游资产一行不改原生运行；oh-my-niu 与外部源互不干扰，可并存。',
    qEn: 'Can I run oh-my-bash themes and plugins?',
    aEn: 'Yes — niu plugin add oh-my-bash (the catalog points at the official upstream repo) runs upstream assets unmodified; oh-my-niu and external sources do not interfere and can coexist.',
  },
  {
    id: 'omn-update',
    q: 'oh-my-niu 怎么更新？',
    a: '捆绑基线随 niu self-update 推进。它不是 niu plugin source——niu plugin update oh-my-niu 报 unknown source（niubash 1.4.4 实测），spec+lockfile 机制管的是外部第三方源。',
    qEn: 'How do I update oh-my-niu?',
    aEn: 'The bundled baseline advances with niu self-update. It is not a niu plugin source — niu plugin update oh-my-niu fails with "unknown source" (measured on niubash 1.4.4); the spec+lockfile mechanism governs external third-party sources.',
  },
];

/** 页面选用的子集 id → FaqItem[] */
export function faqByIds(ids: string[]): FaqItem[] {
  return ids.map((id) => faqItems.find((f) => f.id === id)).filter((f): f is FaqItem => Boolean(f));
}

/** FAQPage JSON-LD（lang: 'zh' | 'en'） */
export function faqJsonLd(items: FaqItem[], lang: 'zh' | 'en'): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: lang === 'en' ? f.qEn : f.q,
      acceptedAnswer: { '@type': 'Answer', text: lang === 'en' ? f.aEn : f.a },
    })),
  };
}

/** 五张产品页的 FAQ 子集（issue #22，对齐 niubash 页口径）。 */
export const PRODUCT_FAQ_IDS: Record<string, string[]> = {
  rubash: ['what-is-rubash', 'embed-api', 'builtins-62', 'what-is-83', 'perf'],
  winuxcmd: ['winuxcmd-what', 'winuxcmd-perf', 'winuxcmd-diff', 'wpm-winuxcmd', 'free-platforms'],
  'niu-git': ['niugit-what', 'niugit-fast', 'niugit-install', 'gitbash-diff', 'perf'],
  wpm: ['wpm-install', 'wpm-index', 'wpm-mirror', 'wpm-winuxcmd', 'wpm-gui'],
  'oh-my-niu': ['omn-enable', 'omn-theme', 'omn-osh', 'omn-update', 'free-platforms'],
};
