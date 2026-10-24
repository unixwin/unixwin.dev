#!/usr/bin/env node
/**
 * gen-og.mjs（issue #18）——构建期生成产品专属 OG 图（1200×630 PNG）。
 * 数据源：src/data/products.json（name/tagline_en/accent）+ src/data/repo-meta.json（版本徽标）。
 * 产物：public/og/<id>.png；页面经 DocsLayout/BaseLayout 的 ogImage="/og/<id>.png" 引用。
 * 文案用英文（构建服务器无 CJK 字体，librsvg 缺字形会出豆腐块）。
 * sharp 为 astro 的传递依赖，可直接 require。
 */
import products from '../src/data/products.json' with { type: 'json' };
import repoMeta from '../src/data/repo-meta.json' with { type: 'json' };
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'og');
mkdirSync(outDir, { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ~52 chars per line at 34px DejaVu Sans (≈0.55em advance) within 1040px
function wrap(text, max = 52) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2); // OG 图只留两行，多余截断
}

const repos = repoMeta.repos ?? {};
// repo key 大小写兜底：products.json 写 "WinuxCmd"，repo-meta.json 的键是 "winuxcmd"
const latestOf = (repo) => {
  const key = repo.split('/').pop() ?? '';
  return (repos[key] ?? repos[key.toLowerCase()] ?? {})?.latest ?? '';
};

for (const p of products) {
  const latest = latestOf(p.repo);
  const accent = p.accent || '#e2500e';
  const tagLines = wrap(p.tagline_en);
  const nameY = 300;
  const tagY0 = nameY + 78;

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#131417"/>
  <rect x="0" y="0" width="1200" height="10" fill="${accent}"/>
  <rect x="80" y="196" width="56" height="8" fill="${accent}"/>
  <text x="80" y="140" font-family="DejaVu Sans Mono, monospace" font-size="28" letter-spacing="10" fill="#9aa3ad">UNIXWIN</text>
  <text x="80" y="${nameY}" font-family="DejaVu Sans, sans-serif" font-weight="700" font-size="96" fill="#f5f6f3">${esc(p.name)}</text>
  ${tagLines
    .map(
      (l, i) =>
        `<text x="80" y="${tagY0 + i * 48}" font-family="DejaVu Sans, sans-serif" font-size="34" fill="#c8cdd4">${esc(l)}</text>`
    )
    .join('\n  ')}
  ${latest
    ? `<rect x="80" y="470" rx="17" width="${Math.max(120, String(latest).length * 20 + 44)}" height="44" fill="none" stroke="${accent}" stroke-width="2"/>
  <text x="${80 + Math.max(120, String(latest).length * 20 + 44) / 2}" y="${470 + 30}" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="24" fill="${accent}">${esc(latest)}</text>`
    : ''}
  <text x="80" y="580" font-family="DejaVu Sans Mono, monospace" font-size="24" fill="#6b7280">unixwin.dev/${p.id === 'niubash' ? '' : 'products/' + p.id + '/'}  ·  github.com/unixwin</text>
</svg>`;

  const out = join(outDir, `${p.id}.png`);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
  console.log(`[og] ${p.id}.png  (${p.name} ${latest})`);
}
