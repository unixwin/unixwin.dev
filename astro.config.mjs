// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://unixwin.dev',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      // lastmod = 本次构建时间（issue #14）：帮助爬虫调度增量抓取。
      // 全站静态构建，每次发布即全量刷新，统一构建时间即最准确的 lastmod。
      lastmod: new Date(),
    }),
  ],
});
