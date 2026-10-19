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

/** 有对应英文版的 zh 路径（新增 en 页时同步维护此清单）。 */
export const PAIRED_ZH_ROUTES: ReadonlySet<string> = new Set([
  '/',
  '/agents/',
  '/benchmarks/',
  '/ai/',
  '/docs/',
]);

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
  if (!PAIRED_ZH_ROUTES.has(p)) return null;
  return p === '/' ? '/en/' : `/en${p}`;
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
