// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(root, 'src', 'pages');

/** git 最后提交时间（ISO）；无记录返回 null。 */
const timeCache = new Map();
function gitTime(rel) {
  if (timeCache.has(rel)) return timeCache.get(rel);
  let t = null;
  try {
    t = execSync(`git log -1 --format=%cI -- ./${rel}`, { cwd: root }).toString().trim() || null;
  } catch {
    t = null;
  }
  timeCache.set(rel, t);
  return t;
}

/**
 * 路由 → 源文件映射（issue #24：sitemap lastmod 用各页真实最后提交时间，
 * 而非统一构建时间，让爬虫能增量调度）。
 * 内容随构建期数据刷新的页面（首页版本号、changelog、产品页 meta 行）把
 * 对应数据文件一并计入，取两者最新。
 */
const DATA = {
  versions: ['src/data/repo-meta.json', 'src/data/changelogs.json'],
  changelog: ['src/data/changelogs.json'],
  agents: ['src/data/agents.json'],
  faq: ['src/data/faq.ts'],
};

function routeToFile(route) {
  // 归一化：/、/x/；剥 /en 前缀得 zh 源文件路径
  let p = route.replace(/\/+$/, '') || '/';
  const isEn = p === '/en' || p.startsWith('/en/');
  if (isEn) p = p === '/en' ? '/' : p.replace(/^\/en/, '');
  if (p === '/') return { file: 'src/pages/index.astro', extra: DATA.versions };

  const base = isEn ? 'src/pages/en' : 'src/pages';
  // 动态路由：agent 详情页（zh/en 同模板，数据驱动）。注意 p 已剥尾斜杠。
  const agentMatch = p.match(/^\/agents\/([^/]+)$/);
  if (agentMatch && agentMatch[1] !== 'universal') {
    return {
      file: `${base}/agents/[slug].astro`,
      extra: [...DATA.agents, ...(isEn ? [] : [])],
    };
  }
  // 静态：优先 <route>/index.astro，其次 <route>.astro
  const asDir = `${base}${p}/index.astro`;
  const asFile = `${base}${p}.astro`;
  const file = existsSync(asDir) ? asDir : existsSync(asFile) ? asFile : null;
  const extra = [];
  if (p.startsWith('/changelog')) extra.push(...DATA.changelog);
  if (p.startsWith('/products/') || p === '/docs/cli/') extra.push(...DATA.versions);
  if (p === '/ai/' || p.startsWith('/docs/')) extra.push(...DATA.faq);
  return { file, extra };
}

function lastmodFor(route) {
  const { file, extra } = routeToFile(route);
  const times = [];
  if (file && existsSync(join(root, file))) {
    const t = gitTime(file);
    if (t) times.push(t);
  }
  for (const e of extra ?? []) {
    const t = gitTime(e);
    if (t) times.push(t);
  }
  if (!times.length) return null;
  return times.sort().at(-1);
}

// https://astro.build/config
export default defineConfig({
  site: 'https://unixwin.dev',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      // lastmod = 各页源文件/数据文件的 git 最后提交时间（issue #24）；
      // 拿不到提交时间的页回落构建时间。
      serialize(item) {
        try {
          const route = new URL(item.url).pathname;
          const lastmod = lastmodFor(route);
          if (lastmod) return { ...item, lastmod };
        } catch {
          /* 回落构建时间 */
        }
        return item;
      },
    }),
  ],
});
