#!/usr/bin/env node
/**
 * 构建后处理（issue #14）：
 *   dist/sitemap.xml ← dist/sitemap-0.xml
 * @astrojs/sitemap 产出 sitemap-index.xml + sitemap-0.xml；不少工具与人工习惯
 * 先试 /sitemap.xml，这里复制一份单文件 sitemap（全量 URL + lastmod）作为别名。
 * 缺文件时静默跳过，不阻塞构建。
 */
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const src = join(dist, 'sitemap-0.xml');
const dest = join(dist, 'sitemap.xml');

if (existsSync(src)) {
  copyFileSync(src, dest);
  console.log(`[postbuild] sitemap.xml <- sitemap-0.xml (${dest})`);
} else {
  console.log('[postbuild] sitemap-0.xml not found, skip sitemap.xml alias');
}
