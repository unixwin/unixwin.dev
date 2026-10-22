#!/usr/bin/env node
/**
 * fetch-changelogs.mjs — 拉取 unixwin 各仓库 CHANGELOG.md 并解析为
 * Keep a Changelog 结构，写 src/data/changelogs.json。
 *
 * 源优先级（每仓库依次尝试，任一成功即止）：
 *   1. https://raw.githubusercontent.com/unixwin/<repo>/master/CHANGELOG.md
 *   2. https://raw.githubusercontent.com/unixwin/<repo>/main/CHANGELOG.md
 *   3. https://gh.caomengxuan666.com/ghraw/unixwin/<repo>/master/CHANGELOG.md
 *   4. 本地克隆 ~/unixwin-repos/<repo>/CHANGELOG.md（离线兜底）
 *
 * 解析容错：
 *   - `## [1.4.0] - 2026-10-10` / `## [1.1.7] - `（空日期）
 *   - `## [Unreleased]` / `## 2.0.0 (unreleased)`（标记 unreleased）
 *   - `### Added/Changed/Fixed/Removed/Deprecated/Security` 及任意自定义组名
 *   - 版本块内没有 ### 小组时，条目归入 "" 组
 *   - 非版本 `##` 标题（如「版本命名规则」）终止当前版本块且内容不计入
 *
 * 任何仓库解析/拉取失败：console.warn 后跳过，绝不中断。
 * 每仓库只保留文档顺序（即新→旧）的前 10 个版本。
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { readFile } from 'node:fs/promises';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/changelogs.json');

const REPOS = ['niubash', 'WinuxCmd', 'rubash', 'niu-git', 'oh-my-niu'];
const KEEP_VERSIONS = 10;
const FETCH_TIMEOUT_MS = 15_000;
const RAW_BASE = 'https://raw.githubusercontent.com/unixwin';
const MIRROR_BASE = 'https://gh.caomengxuan666.com/ghraw/unixwin';

async function fetchText(url, extraHeaders = {}) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'user-agent': 'unixwin.dev-portal/1.0', ...extraHeaders },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchChangelog(repo) {
  const urls = [
    `${RAW_BASE}/${repo}/master/CHANGELOG.md`,
    `${RAW_BASE}/${repo}/main/CHANGELOG.md`,
    `${MIRROR_BASE}/${repo}/master/CHANGELOG.md`,
  ];
  for (const url of urls) {
    try {
      const text = await fetchText(url);
      console.log(`  [net] ${repo}: ok ${url}`);
      return { text, source: url };
    } catch (err) {
      console.warn(`  [net] ${repo}: miss ${url} (${err.message})`);
    }
  }
  // raw CDN 抽风时的兜底：GitHub contents API（Accept raw）
  try {
    const url = `https://api.github.com/repos/unixwin/${repo}/contents/CHANGELOG.md?ref=master`;
    const text = await fetchText(url, {
      headers: { Accept: 'application/vnd.github.raw' },
    });
    console.log(`  [net] ${repo}: ok (contents API)`);
    return { text, source: url };
  } catch (err) {
    console.warn(`  [net] ${repo}: miss contents API (${err.message})`);
  }
  // 离线兜底：本地已有克隆
  const local = join(homedir(), 'unixwin-repos', repo, 'CHANGELOG.md');
  try {
    const text = await readFile(local, 'utf8');
    console.warn(`  [local] ${repo}: using offline clone ${local}`);
    return { text, source: local };
  } catch {
    throw new Error(`all sources failed (network x3 + local clone missing)`);
  }
}

const VERSION_HEADING =
  /^##\s+\[?((?:\d+)[0-9A-Za-z.\-_+]*)\]?\s*(?:\(\s*unreleased\s*\)|-\s*(\S.*)?)?$/i;
const UNRELEASED_HEADING = /^##\s+\[?\s*unreleased\s*[^\dA-Za-z]*\]?\s*$/i;

function stripInline(md) {
  return md
    .replace(/\*\*/g, '')
    .replace(/^\s*[-*+]\s+/, '')
    .trim();
}

function parseChangelog(markdown) {
  const versions = [];
  let current = null; // { version, date, unreleased, sections, order }
  let section = null;

  const closeVersion = () => {
    if (current && Object.keys(current.sections).length > 0) versions.push(current);
    current = null;
    section = null;
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();

    if (/^##\s/.test(line)) {
      closeVersion();
      const unreleasedMatch = line.match(UNRELEASED_HEADING);
      if (unreleasedMatch) {
        current = { version: 'Unreleased', date: '', unreleased: true, sections: {} };
        section = null;
        continue;
      }
      const m = line.match(VERSION_HEADING);
      if (m) {
        const isUnreleased = /unreleased/i.test(line);
        current = {
          version: m[1],
          date: (m[2] ?? '').trim(),
          unreleased: isUnreleased,
          sections: {},
        };
        section = null;
      }
      continue;
    }

    if (current && /^###\s/.test(line)) {
      section = line.replace(/^###\s+/, '').trim() || '';
      current.sections[section] ??= [];
      continue;
    }

    if (current && line.trim() !== '') {
      section ??= '';
      current.sections[section] ??= [];
      const text = stripInline(line);
      if (text) current.sections[section].push(text.slice(0, 600));
    }
  }
  closeVersion();
  return versions;
}

const repos = [];
for (const repo of REPOS) {
  try {
    const { text, source } = await fetchChangelog(repo);
    const versions = parseChangelog(text);
    if (versions.length === 0) throw new Error('no version headings parsed');
    repos.push({
      repo,
      source,
      versions: versions.slice(0, KEEP_VERSIONS).map((v) => ({
        version: v.version,
        date: v.date,
        ...(v.unreleased ? { unreleased: true } : {}),
        sections: v.sections,
      })),
    });
    console.log(`  [ok] ${repo}: ${Math.min(versions.length, KEEP_VERSIONS)} versions (of ${versions.length} parsed)`);
  } catch (err) {
    // 回退：无 CHANGELOG 的仓库（如 niu-git）用 GitHub tags 生成轻量版本条目
    try {
      const res = await fetch(`https://api.github.com/repos/unixwin/${repo}/tags?per_page=10`);
      if (!res.ok) throw new Error(`tags API ${res.status}`);
      const tags = await res.json();
      if (!Array.isArray(tags) || tags.length === 0) throw new Error('no tags');
      repos.push({
        repo,
        source: `api.github.com/repos/unixwin/${repo}/tags`,
        versions: tags.slice(0, KEEP_VERSIONS).map((t) => ({
          version: t.name,
          date: '',
          sections: {},
        })),
      });
      console.log(`  [tags-fallback] ${repo}: ${tags.length} tags`);
    } catch (err2) {
      console.warn(`  [skip] ${repo}: ${err.message} / tags fallback: ${err2.message}`);
    }
  }
}

const payload = { fetchedAt: new Date().toISOString(), repos };
await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`wrote ${OUT} — ${repos.length}/${REPOS.length} repos`);
