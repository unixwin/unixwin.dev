#!/usr/bin/env node
/**
 * fetch-repo-meta.mjs — 拉取六仓库 GitHub 元数据（stars + 最新 release tag），
 * 写 src/data/repo-meta.json。
 *
 * 数据源：
 *   GET https://api.github.com/repos/unixwin/<repo>            → stargazers_count
 *   GET https://api.github.com/repos/unixwin/<repo>/releases/latest → tag_name
 *
 * 未认证 403 / 429 / 网络失败时回退：
 *   stars  ← 上一次运行的 src/data/repo-meta.json 缓存，再回落 products.json 静态值
 *   latest ← src/data/changelogs.json 中该仓库最新版本号（需先跑 fetch-changelogs）
 *
 * 可选：环境变量 GITHUB_TOKEN 提高限额。任何失败只 console.warn，绝不中断。
 */
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/repo-meta.json');

const FETCH_TIMEOUT_MS = 15_000;
const API = 'https://api.github.com/repos/unixwin';
const headers = {
  accept: 'application/vnd.github+json',
  'user-agent': 'unixwin.dev-portal/1.0',
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function getJson(url) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const products = JSON.parse(await readFile(join(ROOT, 'src/data/products.json'), 'utf8'));

// 回退缓存：上次 repo-meta.json + changelogs.json 首版本
let prevMeta = { repos: {} };
try {
  prevMeta = JSON.parse(await readFile(OUT, 'utf8'));
} catch {
  /* 首次运行 */
}
let changelogs = { repos: [] };
try {
  changelogs = JSON.parse(await readFile(join(ROOT, 'src/data/changelogs.json'), 'utf8'));
} catch {
  /* 尚未跑 fetch-changelogs */
}
const firstVersionByRepo = new Map(
  changelogs.repos.map((r) => [r.repo, r.versions[0]?.version ?? null]),
);

const result = { repos: {} };
for (const product of products) {
  const repoName = product.repo.split('/').pop();
  let stars = prevMeta.repos?.[product.id]?.stars ?? product.stars;
  let latest = prevMeta.repos?.[product.id]?.latest ?? firstVersionByRepo.get(repoName) ?? null;

  try {
    const info = await getJson(`${API}/${repoName}`);
    if (typeof info.stargazers_count === 'number') stars = info.stargazers_count;
    console.log(`  [ok] ${repoName}: stars=${stars}`);
  } catch (err) {
    console.warn(`  [fallback stars] ${repoName}: ${err.message} → keep ${stars}`);
  }

  try {
    const release = await getJson(`${API}/${repoName}/releases/latest`);
    if (release.tag_name) latest = release.tag_name;
  } catch (err) {
    console.warn(`  [fallback latest] ${repoName}: ${err.message} → keep ${latest}`);
  }

  result.repos[product.id] = { stars, latest };
}

result.fetchedAt = new Date().toISOString();
await writeFile(OUT, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`wrote ${OUT} — ${Object.keys(result.repos).length} products`);
