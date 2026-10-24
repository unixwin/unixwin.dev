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
    a: '一次性执行（niu -c true）经专项优化后 19.8ms；niu-git 启动约 14ms（Git Bash 45–103ms）；命令替换与子壳类负载比 GNU bash 快 13–62x。全部数字附实测方法与复现产物，见「基准测试」（/benchmarks/）。',
    qEn: 'How is the performance?',
    aEn: 'One-shot execution (niu -c true) is 19.8 ms after dedicated optimization; niu-git starts in ~14 ms (Git Bash: 45–103 ms); command-substitution and subshell workloads run 13–62x faster than GNU bash. Every number ships with its measurement method and reproducible artifacts — see Benchmarks (/benchmarks/).',
  },
  {
    id: 'naming',
    q: 'niu 和 niubash 是什么关系？',
    a: 'niu 是 niubash 的可执行程序名（winget 安装后命令就叫 niu）。家族分工：引擎层 rubash（可嵌入的 Bash 5.3 兼容引擎）、命令层 WinuxCmd、Git 是 niu-git、包管理器是 wpm、主题框架是 oh-my-niu。',
    qEn: 'What is the relation between niu and niubash?',
    aEn: 'niu is the executable name of niubash (after winget install the command is niu). The family splits as: rubash (the embeddable Bash 5.3-compatible engine), WinuxCmd (Unix commands), niu-git (Git), wpm (package manager) and oh-my-niu (theme framework).',
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
