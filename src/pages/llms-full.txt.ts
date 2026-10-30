import type { APIRoute } from 'astro';
import products from '../data/products.json';
import repoMeta from '../data/repo-meta.json';
import facts from '../data/facts.json';
import agentsData from '../data/agents.json';
import { faqItems } from '../data/faq';

/**
 * /llms-full.txt — llms.txt 的全文版（issue #11，llmstxt.org 规范的 -full 变体）。
 * 构建期从 src/data/*.json 与 faq.ts 拼装，与站点页面共用同一数据源——
 * 页面文案/版本更新时这里自动跟上，不存在手写第二副本。
 */
const ordered = [...products].sort((a, b) => a.order - b.order);
const repos = (repoMeta as { fetchedAt?: string; repos: Record<string, { stars?: number; latest?: string | null }> }).repos;
const metaDate = repoMeta.fetchedAt ? repoMeta.fetchedAt.slice(0, 10) : '';
const agents = agentsData.agents as Array<{
  slug: string;
  name: string;
  status: string;
  variants: string[];
  mechanism: string;
  oneLiner: string;
  oneLiner_en?: string;
}>;

const latestOf = (repo: string) => repos[repo.split('/').pop() ?? '']?.latest ?? '—';

const productBlocks = ordered
  .map((p) => {
    const lines = [
      `### ${p.name}`,
      '',
      p.tagline_en,
      `- Repo: https://${p.repo}`,
      `- Docs: https://unixwin.dev/en/products/${p.id}/`,
      `- Latest release: ${latestOf(p.repo)}${metaDate ? ` (fetched ${metaDate})` : ''}`,
      `- Command: \`${p.cmd}\``,
    ];
    if (p.id === 'niubash') {
      lines.push(
        '- Install (Windows, winget): `winget install --id Unixwin.Niubash --source winget`',
        '- Install (Windows, script): `irm https://unixwin.dev/install.ps1 | iex`',
        `- Compatibility: GNU Bash upstream test suites ${facts.bashSuites} passing, ${facts.byteIdentical}.`,
        `- Agent flags: \`niu --encoded-command <base64>\` (quote-free channel), \`niu --cwd-state <file>\` (cwd memory across one-shot calls).`
      );
    }
    if (p.id === 'wpm') {
      lines.push(
        '- Bundled with WinuxCmd: `wpm` prints help, `wpm list` browses the 281-package official index, `wpm install <pkg>` installs.'
      );
    }
    return lines.join('\n');
  })
  .join('\n\n');

const agentLines = agents
  .map((a) => {
    const st = a.status === 'ready' ? 'ready out of the box' : a.status;
    return `- [${a.name}](https://unixwin.dev/en/agents/${a.slug}/): ${a.oneLiner_en ?? a.oneLiner} (${st}; mechanism: ${a.mechanism})`;
  })
  .join('\n');

const faqLines = faqItems.map((f) => `### ${f.qEn}\n\n${f.aEn}`).join('\n\n');

const body = `# UNIXWIN

> AI-native bash family — real bash syntax, real Unix commands, native Windows/Linux/macOS. No WSL, no MSYS.

This is the full-text companion of https://unixwin.dev/llms.txt (same data sources as the website; versions refresh from GitHub Releases at build time${metaDate ? `, last fetch ${metaDate}` : ''}).

Updates: fast-moving project — performance & compatibility improve daily. For the latest, see the Changelog (https://unixwin.dev/changelog/) and GitHub Releases (https://github.com/unixwin/niubash/releases).

## Quick Start

\`\`\`
winget install --id Unixwin.Niubash --source winget
# or: irm https://unixwin.dev/install.ps1 | iex
# verify:
niu --version
echo "SHELL=$SHELL"; uname -s
\`\`\`

## Family facts (measured)

- GNU Bash upstream test suites: ${facts.bashSuites} passing, ${facts.byteIdentical}
- Unix commands bundled: ${facts.commands} (${facts.options} options)
- git startup (niu-git, Windows): ${facts.gitStartup} vs Git Bash 45–103 ms
- One-shot execution \`niu -c true\`: 19.8 ms (was 105.6 ms) — measured on Windows
- One-shot execution \`niu -c 'true'\` (Linux caliber, re-measured 2026-10-28): 4.14 ms (bare run p50 3.71 ms; GNU bash 5.3.20 2.67 / 2.60 ms — Linux same-machine, release builds)
- Installed family size: ${facts.familySize}, zero DLL dependencies
- Native platforms: ${facts.platforms} (Windows x64/arm64, Linux gnu/musl, macOS, Android, OpenHarmony CI gates)
- Unit tests: ${facts.unitTests}
- AI agents wired: ${facts.aiAgents} (${agents.filter((a) => a.status === 'ready').length} work out of the box)

## Products

${productBlocks}

## For AI agents

- [AI portal](https://unixwin.dev/ai/): paste-ready install prompt, official skill, wpm quick start, machine-readable entries.
- [agents.md](https://unixwin.dev/agents.md): markdown edition of the AI portal.
- [Agent directory](https://unixwin.dev/agents/): per-agent switch scripts with verify & rollback (${agents.length} agents).
- [Universal wiring guide](https://unixwin.dev/agents/universal/): the four shell-detection mechanisms and known traps.

### Per-agent notes

${agentLines}

## FAQ

${faqLines}

## Docs

- [Docs home](https://unixwin.dev/docs/): niubash vs bash overview.
- [Paths & MSYS](https://unixwin.dev/docs/paths-and-msys/): four path dialects, argv verbatim contract.
- [Execution model](https://unixwin.dev/docs/execution-model/): zero-fork subshells, inline coreutils.
- [Compatibility](https://unixwin.dev/docs/compatibility/): what 83/83 GNU suites means, true-baseline method.
- [Performance model](https://unixwin.dev/docs/performance-model/): where the speed comes from.
- [CLI reference](https://unixwin.dev/docs/cli/): full \`niu\` CLI surface + GNU bash compatibility flags.
- [Full manual](https://unixwin.github.io/niubash/): official niubash documentation site.

## Benchmarks & changelog

- [Benchmarks](https://unixwin.dev/benchmarks/): measured numbers vs Git Bash / WSL / GNU bash, with provenance anchors.
- [Changelog](https://unixwin.dev/changelog/): aggregated release timeline across the family (latest versions per product; full history at https://unixwin.dev/changelog/all/).

## Optional

- [wpm index](https://github.com/unixwin/wpm-source): the 281-package official index consumed by \`wpm\`.
- [Privacy](https://unixwin.dev/privacy/): zero-collection policy — the shell phones no server home.
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
