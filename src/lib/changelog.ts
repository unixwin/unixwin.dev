/**
 * changelog 条目构建（issue #17：主页瘦身 → /changelog/all/ 全量页）。
 * 从 changelogs.json + products.json 构建排序后的条目列表。
 */
import changelogs from '../data/changelogs.json';
import products from '../data/products.json';

export interface Entry {
  repo: string;
  productId: string;
  productName: string;
  accent: string;
  version: string;
  date: string;
  unreleased: boolean;
  sections: Record<string, string[]>;
}

const productByRepo = new Map(products.map((p) => [p.repo.split('/').pop(), p]));
// 兜底主色取自 products.json 首条（数据驱动，避免硬编码颜色）
const defaultAccent = products[0]?.accent ?? 'var(--accent)';

export function buildEntries(): Entry[] {
  const entries: Entry[] = [];
  for (const repo of changelogs.repos ?? []) {
    const product = productByRepo.get(repo.repo);
    for (const v of repo.versions ?? []) {
      entries.push({
        repo: repo.repo,
        productId: product?.id ?? repo.repo,
        productName: product?.name ?? repo.repo,
        accent: product?.accent ?? defaultAccent,
        version: v.version,
        date: v.date ?? '',
        unreleased: Boolean(v.unreleased),
        sections: v.sections ?? {},
      });
    }
  }

  // 排序：Unreleased 沉底（issue#1 P2-8）→ 日期倒序 → 无日期垫底
  entries.sort((a, b) => {
    if (a.unreleased !== b.unreleased) return a.unreleased ? 1 : -1;
    const da = /^\d{4}-\d{2}-\d{2}$/.test(a.date) ? a.date : '';
    const db = /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : '';
    if (da && db) return da === db ? a.repo.localeCompare(b.repo) : da < db ? 1 : -1;
    if (da) return -1;
    if (db) return 1;
    return 0;
  });

  return entries;
}

/** 主页瘦身：每个产品保留最近 keepPerRepo 个已发布版本（Unreleased 全保留）。 */
export function slimEntries(entries: Entry[], keepPerRepo = 3): Entry[] {
  const seen = new Map<string, number>();
  return entries.filter((e) => {
    if (e.unreleased) return true;
    const n = (seen.get(e.repo) ?? 0) + 1;
    seen.set(e.repo, n);
    return n <= keepPerRepo;
  });
}

export function repoNames(): string[] {
  return [...new Set((changelogs.repos ?? []).map((r) => r.repo))];
}

export function fetchedDate(): string {
  return changelogs.fetchedAt ? new Date(changelogs.fetchedAt).toISOString().slice(0, 10) : '';
}

export { productByRepo };
