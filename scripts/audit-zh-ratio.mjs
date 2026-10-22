#!/usr/bin/env node
/**
 * audit-zh-ratio.mjs — 站点中英占比盘点。
 *
 * 扫 dist 下所有 index.html，抽每页 <title> 与 main 可见文本的中文占比：
 *   ratio = CJK 字符数 / (CJK 字符数 + 拉丁字母数)   （去掉 script/style/注释/标签后）
 * 输出全部页面明细 + 「ratio > 0.30 且非 zh 专属路径」的问题清单
 * （zh 专属 = 路径不在 /en/ 前缀下、也不是 /agents.md 这类双语端点；
 *   本脚本把 /en/** 与 /agents.md、/llms.txt 视为「应检英文面」）。
 *
 * 用法：node scripts/audit-zh-ratio.mjs [distDir]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const distDir = process.argv[2] || join(process.cwd(), 'dist');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (name === 'index.html') out.push(p);
  }
  return out;
}

function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, ' ') : '(no title)';
}

function visibleText(html) {
  let t = html;
  // main 优先：没有 main 的页面退回 body
  const main = t.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  t = main ? main[1] : t;
  t = t
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(pre|code)\b[\s\S]*?<\/\1>/gi, (m) => m.replace(/[\u4e00-\u9fa5]/g, '')) // 代码块里的中文注释不计
    .replace(/<[^>]+>/g, ' ');
  return t;
}

function zhRatio(text) {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  const denom = cjk + latin;
  return { cjk, latin, ratio: denom === 0 ? 0 : cjk / denom };
}

const files = walk(distDir).sort();
const rows = [];
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const rel = '/' + relative(distDir, f).split(sep).join('/').replace(/\/index\.html$/, '/').replace(/^\/$/, '');
  const title = extractTitle(html);
  const { cjk, latin, ratio } = zhRatio(visibleText(html));
  // 「应检英文面」：/en/ 前缀页 + 根级机器端点（agents.md 生成页形态为 agents.md/index.html 不存在，跳过）
  const isEn = rel === '/en/' || rel.startsWith('/en/');
  rows.push({ path: rel, title, cjk, latin, ratio, isEn });
}

console.log('== 全部页面（路径 | 中文占比 | CJK/拉丁 | title）==');
for (const r of rows) {
  console.log(
    `${r.path.padEnd(34)} ${(r.ratio * 100).toFixed(1).padStart(5)}%  (${String(r.cjk).padStart(5)}/${String(r.latin).padStart(6)})  ${r.title}`,
  );
}

console.log('\n== 问题清单：/en/** 下中文占比 > 30% ==');
const flagged = rows.filter((r) => r.isEn && r.ratio > 0.3);
if (!flagged.length) console.log('（无）');
for (const r of flagged) {
  console.log(`${r.path}  ${r.title}  ${(r.ratio * 100).toFixed(1)}%`);
}

console.log(`\n共扫描 ${rows.length} 页；/en/ 页 ${rows.filter((r) => r.isEn).length} 页，其中问题页 ${flagged.length} 页。`);
