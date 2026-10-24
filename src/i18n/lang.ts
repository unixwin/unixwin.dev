/**
 * i18n 路由助手 — zh/en 双语配对（zh 在根路径，en 在 /en/ 前缀下）。
 *
 * 配对规则：zh 页在 /x，en 页在 /en/x，成对出现；只有下面清单里的 zh 路径
 * 才有对应 en 页（PAIRED_ZH_ROUTES 与 src/pages/en/ 目录保持同步）。
 *
 * sessionStorage 契约（与旧站一致）：
 *   niu-lang-override — 用户经 LangSwitch 手动选过语言，自动跳转永不生效
 *   niu-lang-auto     — 本次会话已做过一次自动语言判定（防循环，每会话一次）
 */

/** 有对应英文版的 zh 路径（新增 en 页时同步维护此清单）。
 *  深页配对（2026-10-24 枚举自 dist，修复产品/docs 深页 EN 切换回退到区段首页的问题）：
 *  - 产品 6 页、docs 文章 5 页、/changelog/all/、/agents/universal/：显式枚举（稳定）；
 *  - /agents/<slug>/：由 agents.json 数据驱动（见 agentsDeepPair，新增 agent 自动配对）。 */
import agentsJson from '../data/agents.json';

const AGENT_SLUGS: ReadonlySet<string> = new Set(
  (agentsJson as { agents: { slug: string }[] }).agents.map((a) => a.slug),
);

export const PAIRED_ZH_ROUTES: ReadonlySet<string> = new Set([
  '/',
  '/agents/',
  '/benchmarks/',
  '/ai/',
  '/docs/',
  '/changelog/',
  '/privacy/',
  // 产品文档页（zh/en 双语全量）
  '/products/niubash/',
  '/products/winuxcmd/',
  '/products/rubash/',
  '/products/niu-git/',
  '/products/wpm/',
  '/products/oh-my-niu/',
  // docs 文章页
  '/docs/cli/',
  '/docs/compatibility/',
  '/docs/execution-model/',
  '/docs/paths-and-msys/',
  '/docs/performance-model/',
  // changelog 全量页 + agents 万能接入手册
  '/changelog/all/',
  '/agents/universal/',
]);

/** /agents/<slug>/ 深页配对（slug 集合来自 agents.json，单一事实源）。 */
export function agentsDeepPair(p: string): string | null {
  const m = p.match(/^\/agents\/([^/]+)\/$/);
  if (!m) return null;
  return AGENT_SLUGS.has(m[1]) || m[1] === 'universal' ? `/en${p}` : null;
}

export type PageLang = 'zh' | 'en';

/** 规范化路径：保证以 / 开头、非根路径以 / 结尾（与目录式路由一致）。 */
export function normalizePath(p: string): string {
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && !p.endsWith('/')) p = `${p}/`;
  return p;
}

/** 从路径推断语言：/en 前缀 → en，其余 → zh。 */
export function inferLang(path: string): PageLang {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'zh';
}

/** zh 路径 → 对应 en 路径；无对应 en 页返回 null。 */
export function zhToEn(zhPath: string): string | null {
  const p = normalizePath(zhPath);
  if (PAIRED_ZH_ROUTES.has(p)) return p === '/' ? '/en/' : `/en${p}`;
  return agentsDeepPair(p);
}

/** en 路径 → 对应 zh 路径（去掉 /en 前缀；非 en 路径原样规范化返回）。 */
export function enToZh(enPath: string): string {
  const p = normalizePath(enPath);
  if (p === '/en/' || p === '/en') return '/';
  return normalizePath(p.replace(/^\/en\//, '/'));
}

export interface LangPair {
  /** 当前页语言 */
  lang: PageLang;
  /** 当前页的 zh 规范化路径 */
  zhPath: string;
  /** 当前页的 en 路径（无对应 en 页时为 null） */
  enPath: string | null;
  /** 另一语言页路径（无对应页时为 null），LangSwitch 跳转目标 */
  otherPath: string | null;
}

/**
 * 解析某页的语言配对信息。
 * @param path  当前页规范化路径（BaseLayout 的 path / Astro.url.pathname 均可）
 * @param lang  显式语言（缺省按路径推断）
 * @param enPathHint 显式给的「另一语言页」路径（BaseLayout 的 enPath prop），优先于推断
 */
export function resolveLangPair(
  path: string,
  lang?: PageLang,
  enPathHint?: string,
): LangPair {
  const p = normalizePath(path);
  const resolvedLang = lang ?? inferLang(p);
  if (resolvedLang === 'en') {
    const zhPath = enToZh(p);
    return { lang: 'en', zhPath, enPath: p, otherPath: enPathHint ?? zhPath };
  }
  const enPath = zhToEn(p);
  return { lang: 'zh', zhPath: p, enPath, otherPath: enPathHint ?? enPath };
}

export interface SwitchPair {
  /** 当前页语言 */
  lang: PageLang;
  /** 语言切换按钮的跳转目标（无合理回退时为 null） */
  otherPath: string | null;
}

/**
 * 解析「语言切换按钮」的目标页（SiteHeader/SiteFooter 专用）。
 *
 * 与 resolveLangPair 语义不同：resolveLangPair 只认精确配对（供 BaseLayout
 * 的 hreflang 与自动跳转使用），本函数在无精确配对时按区段回退到「同区段
 * 的另一语言页」，保证除少数无对页外每页都有切换入口。
 *
 * 规则（精确配对优先于前缀回退）：
 *   1. 精确配对：PAIRED_ZH_ROUTES 内 zh 页 ↔ /en/ 镜像直接互指；
 *   2. zh 深页回退：/docs/** → /en/docs/；/agents/**（含 /agents/<slug>/、
 *      /agents/universal/）→ /en/agents/；/products/** → /en/；
 *      /changelog/ → /en/；
 *      其余未配对（/404、/llms.txt、/agents.md、/install.ps1 等）
 *      → null（不渲染切换按钮）；
 *   3. en 深页回退：/en/docs/** → /docs/；其余未配对 /en/** → /。
 *
 * 注意：回退目标仅作按钮跳转，不做 hreflang 声明、不触发自动跳转
 * （BaseLayout 仍走 resolveLangPair，行为不变，避免 SEO 错配）。
 */
export function resolveSwitchPair(pathname: string): SwitchPair {
  const p = normalizePath(pathname);
  if (inferLang(p) === 'en') {
    if (p === '/en/') return { lang: 'en', otherPath: '/' };
    // 精确镜像：/en/ + PAIRED_ZH_ROUTES 直接回指 zh 页
    const zhPath = enToZh(p);
    if (PAIRED_ZH_ROUTES.has(zhPath)) return { lang: 'en', otherPath: zhPath };
    // en 深页回退：/en/docs/**、/en/products/**、/en/agents/** 均有 zh 镜像，
    // 直接回指剥前缀后的 zh 深页；其余未配对 /en/** → /
    if (/^\/en\/(docs|products|agents)\//.test(p)) return { lang: 'en', otherPath: zhPath };
    return { lang: 'en', otherPath: zhPath.startsWith('/docs/') ? '/docs/' : '/' };
  }
  // zh 侧：精确配对优先
  const enPath = zhToEn(p);
  if (enPath) return { lang: 'zh', otherPath: enPath };
  // zh 深页区段回退
  if (p.startsWith('/docs/')) return { lang: 'zh', otherPath: '/en/docs/' };
  if (p.startsWith('/agents/')) return { lang: 'zh', otherPath: '/en/agents/' };
  if (p.startsWith('/products/')) return { lang: 'zh', otherPath: '/en/products/' };

  return { lang: 'zh', otherPath: null };
}

/**
 * 站内链接 → en 版地址（用于 en 页上的导航改写）：
 * 有对应 en 页的内部链接加 /en 前缀（含锚点），其余原样返回。
 */
export function toEnHref(href: string): string {
  if (/^https?:/.test(href) || href.startsWith('/en') || !href.startsWith('/')) return href;
  const hashIdx = href.indexOf('#');
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
  const base = normalizePath(hashIdx >= 0 ? href.slice(0, hashIdx) || '/' : href);
  const enBase = zhToEn(base);
  return enBase ? `${enBase}${hash}` : href;
}
