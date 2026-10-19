import type { APIRoute } from 'astro';
import products from '../data/products.json';

/**
 * /llms.txt — 构建期生成的 text/plain 端点（llmstxt.org 规范）。
 * H1 名称 → blockquote 摘要 → H2 分节（Quick Start / Products / Docs / Optional）。
 */
const ordered = [...products].sort((a, b) => a.order - b.order);

const body = `# UNIXWIN

> AI-native bash family — real bash syntax, real Unix commands, native Windows/Linux/macOS.

## Quick Start

\`\`\`
irm https://dl.caomengxuan666.com/install.ps1 | iex
\`\`\`

## Products

${ordered.map((p) => `- [${p.name}](https://unixwin.dev/#${p.id}): ${p.tagline_en}`).join('\n')}

## For AI Agents

- [AI portal](https://unixwin.dev/ai/): paste-ready install prompt, official skill, machine entry points.
- [agents.md](https://unixwin.dev/agents.md): markdown version of the AI portal.
- [Agent directory](https://unixwin.dev/agents/): per-agent switch scripts with verify & rollback.
- [Universal agent wiring guide](https://unixwin.dev/agents/universal/): the four shell-detection mechanisms.

## Docs

- [niubash vs bash: differences](https://unixwin.dev/docs/): compatibility overview, paths & MSYS, zero-fork execution model, performance.
- [niubash documentation](https://unixwin.github.io/niubash/): manuals, guides and CLI reference.

## Optional

- [Benchmarks](https://unixwin.dev/benchmarks/): measured numbers vs Git Bash / WSL / GNU bash.
- [Changelog](https://unixwin.dev/changelog/): aggregated release timeline across the family.
- [Theme candidate B · clean](https://unixwin.dev/theme/clean/): light theme preview.
- [Theme candidate C · neon](https://unixwin.dev/theme/neon/): neon theme preview.
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
