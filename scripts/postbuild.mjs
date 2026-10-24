#!/usr/bin/env node
/**
 * 构建后处理：
 *   1) dist/sitemap.xml ← dist/sitemap-0.xml（issue #14 别名）
 *   2) 把六个产品页 + 五篇 docs 文章（zh/en）的渲染正文转纯文本，
 *      拼接到 dist/llms-full.txt 的「Full page contents」节（issue #11 复核要求：
 *      llms-full 需为正文全文而非摘要级；直接从构建产物提取，与页面零副本自动同步）。
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;

// ---------- 1) sitemap.xml 别名 ----------
const smSrc = join(dist, 'sitemap-0.xml');
const smDest = join(dist, 'sitemap.xml');
if (existsSync(smSrc)) {
  copyFileSync(smSrc, smDest);
  console.log('[postbuild] sitemap.xml <- sitemap-0.xml');
} else {
  console.log('[postbuild] sitemap-0.xml not found, skip alias');
}

// ---------- 2) llms-full.txt 正文拼接 ----------
/** HTML → 可读纯文本（面向 LLM：保留标题层级/列表/代码块/表格行） */
function htmlToText(html) {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, '');
  // 代码块 → 围栏
  s = s.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, c) => `\n\`\`\`\n${c}\n\`\`\`\n`);
  // 标题
  s = s.replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl, txt) => `\n${'#'.repeat(+lvl + 1)} ${txt.trim()}\n`);
  // 列表项
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, txt) => `\n- ${txt.trim()}`);
  // 表格行：td/th 用 | 连接
  s = s.replace(/<\/t[dh]>\s*<t[dh][^>]*>/gi, ' | ');
  s = s.replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, (_, txt) => ` ${txt.trim()} `);
  s = s.replace(/<\/tr>/gi, '\n');
  // 块级元素换行
  s = s.replace(/<\/(p|div|section|article|header|footer|ul|ol|table|blockquote|figure|figcaption|details|summary|h[1-6])>/gi, '\n');
  s = s.replace(/<(br|hr)\s*\/?>/gi, '\n');
  s = s.replace(/<summary[^>]*>/gi, '\n');
  // 去掉剩余标签
  s = s.replace(/<[^>]+>/g, '');
  // 实体
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  // 压缩空白
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/** 只取 <body> 内容，并剪掉页头导航/页脚（每页相同，无需重复进 llms-full）。 */
function bodyText(html) {
  const m = html.match(/<main[\s\S]*?<\/main>/i);
  let s = m ? m[0] : html;
  s = s.replace(/<aside[\s\S]*?<\/aside>/gi, ''); // 右栏 TOC
  return htmlToText(s);
}

const PAGES = [
  // 产品页（zh → en）
  ['https://unixwin.dev/products/niubash/', 'products/niubash/index.html'],
  ['https://unixwin.dev/products/winuxcmd/', 'products/winuxcmd/index.html'],
  ['https://unixwin.dev/products/rubash/', 'products/rubash/index.html'],
  ['https://unixwin.dev/products/niu-git/', 'products/niu-git/index.html'],
  ['https://unixwin.dev/products/wpm/', 'products/wpm/index.html'],
  ['https://unixwin.dev/products/oh-my-niu/', 'products/oh-my-niu/index.html'],
  ['https://unixwin.dev/en/products/niubash/', 'en/products/niubash/index.html'],
  ['https://unixwin.dev/en/products/winuxcmd/', 'en/products/winuxcmd/index.html'],
  ['https://unixwin.dev/en/products/rubash/', 'en/products/rubash/index.html'],
  ['https://unixwin.dev/en/products/niu-git/', 'en/products/niu-git/index.html'],
  ['https://unixwin.dev/en/products/wpm/', 'en/products/wpm/index.html'],
  ['https://unixwin.dev/en/products/oh-my-niu/', 'en/products/oh-my-niu/index.html'],
  // docs 文章（zh → en）
  ['https://unixwin.dev/docs/', 'docs/index.html'],
  ['https://unixwin.dev/docs/paths-and-msys/', 'docs/paths-and-msys/index.html'],
  ['https://unixwin.dev/docs/execution-model/', 'docs/execution-model/index.html'],
  ['https://unixwin.dev/docs/compatibility/', 'docs/compatibility/index.html'],
  ['https://unixwin.dev/docs/performance-model/', 'docs/performance-model/index.html'],
  ['https://unixwin.dev/docs/cli/', 'docs/cli/index.html'],
  ['https://unixwin.dev/en/docs/', 'en/docs/index.html'],
  ['https://unixwin.dev/en/docs/paths-and-msys/', 'en/docs/paths-and-msys/index.html'],
  ['https://unixwin.dev/en/docs/execution-model/', 'en/docs/execution-model/index.html'],
  ['https://unixwin.dev/en/docs/compatibility/', 'en/docs/compatibility/index.html'],
  ['https://unixwin.dev/en/docs/performance-model/', 'en/docs/performance-model/index.html'],
  ['https://unixwin.dev/en/docs/cli/', 'en/docs/cli/index.html'],
];

const llmsFull = join(dist, 'llms-full.txt');
if (existsSync(llmsFull)) {
  const sections = [];
  for (const [url, file] of PAGES) {
    const fp = join(dist, file);
    if (!existsSync(fp)) continue;
    const text = bodyText(readFileSync(fp, 'utf8'));
    sections.push(`### ${url}\n\n${text}`);
  }
  const appendix =
    `\n\n## Full page contents\n\n` +
    `Full text of the six product pages and the docs area (zh + en), ` +
    `auto-extracted from the rendered pages at build time — same bytes a browser gets.\n\n` +
    sections.join('\n\n---\n\n') +
    '\n';
  writeFileSync(llmsFull, readFileSync(llmsFull, 'utf8') + appendix);
  console.log(`[postbuild] llms-full.txt += ${sections.length} page bodies (${PAGES.length} intended)`);
} else {
  console.log('[postbuild] llms-full.txt not found, skip body appendix');
}
