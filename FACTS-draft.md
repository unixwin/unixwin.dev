# FACTS-draft — unixwin 门户材料包·事实底稿（2026-10-19 采集）

> 采集代理产出。每项给证据路径与原文；采集口径以文件/CI 日志为准，未证处标「未记录」。裁决（哪些数字进门户）由主会话做。

---

## 1. 命令总数

**rubash 无 baseline.json。** 已搜索：`D:/repo/rubash` 与 `D:/repo/niubash` 全仓（排除 .git/target*）无任何 `baseline.json` / `*baseline*.json`；全仓 grep "baseline.json" 零引用。

**rubash 权威口径 = `D:/repo/rubash/docs/builtins.md`**（文件自述"单一事实来源"，由 `src/executor/builtin_names.rs` 的文档同步测试守护——改清单不改文档 `cargo test` 会失败；文件头注明最后核对 2026-09-08）：

| 口径 | 数 | 证据（builtins.md 内） |
|---|---|---|
| 真 builtin | **62 项**（GNU Bash 5.3 的 61 个全覆盖无缺失 + 扩展 `env`；Windows 隐藏 host builtin `sudo` 不计入） | "## 二、真 builtin 清单（62 项）"；机器块 `<!-- builtins-list -->` 实数 62 条 |
| Fast-path 隐藏 builtin | 5 项（sleep、dirname、basename、uname、arch） | "## 三、Fast-Path（隐藏 builtin）清单" + `<!-- fastpath-list -->` |
| 管线阶段 arm | 12 项（true : false echo printf trap head cat sed grep wc tr） | §3.1 `<!-- pipeline-fastpath-list -->` |
| 命令替换 filter arm | 8 项（sort sed tr head grep wc tail uniq；审计 §2.5 认定该层对普通 `$(…|…)` 不可达，dead-code 登记 issue #710） | §3.1 `<!-- substitution-fastpath-list -->` |
| winuxcmd 外部命令（被引用） | 176 个（与 rubash 重叠 13 个） | "## 四、与 winuxcmd 的重叠" |
| 进程内模拟文件命令 | 10 个（cp rm rmdir mkdir touch chmod cat sed mkfifo tty，默认开启层） | §4.1 |

**唯一实际存在的 baseline.json = `D:/repo/WinuxCmd/tests/differential/baseline.json`**（16,907 字节，mtime 2026-10-17 10:39）：JSON 顶层键 `cases`（dict，178 条）= 131 条 `corpus/<命令>/….case`（**67 个不同命令**）+ 47 条 `regressions/….case`。而 `D:/repo/WinuxCmd/README.md:39` 自述 "Differential corpus: 178 cases across 84 commands (165 pass / 13 known platform diffs, `tests/differential/baseline.json`)"——**84 vs 文件实数 67（corpus 键）/178（总键）口径不一致，留主会话裁决**。

**WinuxCmd 产品命令总数**：`D:/repo/WinuxCmd/README.md:32` "**176 commands, 1,924 options**"；:39 脚注：1,924 = `src/commands/` 的 `OPTION(` 宏计数，命令数不含内建 `wpm` 与 `[` 别名；:74 "3.79 MB for 176 commands…~19 ms cold start"（PGO 构建口径）。

**不一致点（供裁决）**：`D:/repo/rubash/README.md:142` 与 `README.zh-CN.md:63` 写 "40+ builtin implementations"，低于 builtins.md 的 62——README 是旧口径或约数。

---

## 2. 单测数与通过率（CI 口径，2026-10-19 最新绿 master）

### rubash — run 39191237754（ci.yml，master `b79e678a`，2026-10-19T02:42:41Z，6 job 全 success）
URL: https://github.com/unixwin/rubash/actions/runs/39191237754 （本地 master 98794cb7 领先，此 run 为远端最新绿）

| job / step | 命令 | 数字（日志原文摘录） |
|---|---|---|
| Rust tests → Run Rust library tests | `cargo nextest run --lib --profile ci` | Summary: **608 tests run: 608 passed, 0 skipped** |
| Rust tests → Run marker leak golden tests | `cargo nextest run --test marker_leak_golden --test issue824_marker_decode_boundary_regressions` | **16 tests run: 16 passed, 0 skipped** |
| Rust tests → Run compatibility CLI tests | `cargo nextest run --test cli_tests --profile ci`，**continue-on-error: true** | "28/465 tests run: **27 passed, 1 failed**, 3 skipped"（fail-fast 提前停）；另有 cargo 形输出 "FAILED. 0 passed; 1 failed; … 467 filtered out"。job 绿因 continue-on-error |
| Rust tests (macOS) | `cargo test --lib` | test result: ok. **608 passed; 0 failed** |
| GNU regression goldens and canaries | `cargo test --test regression` | test result: ok. **74 passed; 0 failed**；快照重录 leg 1 passed |
| Shell functionality tests | shell 脚本套件 | 通过: **6** / 失败: 0 |

- **硬门禁合计（不含 continue-on-error 的 cli_tests lane）：608 + 16 + 74 = 698 passed / 0 failed**。
- 注意：ci.yml 主 lane 只跑 `--lib` + 指定集成测试；`tests/` 下其余集成测试二进制不在 ci.yml 门禁内（workflow 原文见 `.github/workflows/ci.yml:48-63`）。

### niubash — run 39191023176（"Niubash CI"，master `7b4ee734`，2026-10-19T02:39:53Z，8 job 全 success，nightly timing skipped）
URL: https://github.com/unixwin/niubash/actions/runs/39191023176

| job | 命令 | 数字（日志汇总） |
|---|---|---|
| build-and-test（windows-latest） | `cargo test --workspace --locked`（ci.yml:61-62） | 55 个测试二进制，57 行 "test result:" 中 55 行 ok：**1026 passed / 0 failed / 34 ignored** |
| cross-check (ubuntu-latest) | `cargo test --workspace --lib --locked`（**informational，continue-on-error: true**，ci.yml:113-116） | test result: FAILED. **494 passed; 20 failed**（job 结论 success） |
| cross-check (macos-latest) | 同上 | **494 passed; 20 failed**（同注释："lib test suite is informational until the unix cfg-gating work lands. Track the first green run here, then drop continue-on-error."） |
| cross-target-check ×4（android / armv7 / ohos / musl）+ cross-target-smoke | 编译/烟测 | 全 success |

- 日志全文已存本地：`C:/Users/cmx/AppData/Local/Temp/rubash_ci_full.log`（808,466 B）、`C:/Users/cmx/AppData/Local/Temp/niubash_ci_full.log`（1,093,679 B），可复查。

---

## 3. GNU 套件通过率（83/83、82 byte-identical）

**README 声明原文（英文）** — `D:/repo/rubash/README.md`：
- :17 "…compatibility is verified against GNU Bash's own 83-suite upstream test corpus — **83/83 suites pass on the 2026-10-12 full re-run: 82 suites byte-identical**, and nameref's single residual line is proven to be GNU Bash's own coproc reap-timing race, not a rubash divergence (ledger below)."
- :81-102 台账块：:81 "GNU Bash 5.3.0 test suite — 83 files, true-baseline measurement"；:82 "(ledger: 2026-10-12 full re-run on master **764b9dde**, host WINUXSH_ROOT pin scrubbed — no upstream-script stubs, niu-mounted /bin/sh fixture, per-suite TMPDIR, foreground timeout; environment-bound diffs counted as zero after audit; earlier slice: 2026-09-25 on 71c933eb)"；:87 "PASS: 83/83 suites … 100%"；:89 "Byte-identical: **82 suites (0 diff)**"；:90-95 nameref 1 行归因（"proven GNU 5.3.0's own coproc reap-timing race: GNU vs itself flips 59/60↔1/60 … 60/60 deterministic on ext4"）；:96-100 Env-zeroed 名单（A/B: 41de8319 == 764b9dde）；:101 "Was **3427** on Sep 9 → −99%+ raw"
- :104-106 全过套件名单（**82 套逐一列出**）；:108 "（nameref — the 83rd suite — is accounted one block above…）"
- :118-127 扩展表：modernish **166/166** rc-vector identical、mvdan/sh **559** snippets、bash-completion **452/452**、git-completion **140/140**、oh-my-bash **252/252** functions（22 libs）、GNU 83-suite on Linux native **19/24** byte-identical（WSL 内测）

**中文 README** — `D:/repo/rubash/README.zh-CN.md`：:17（83/83、82 逐字节）、:28（83 个文件）、:34（通过 83/83 100%）、:36（逐字节一致 82 套件 0 差异）、:47（9 月 9 日为 3427 行 → −99%+）、:54（第 83 套 nameref 归因）

**83 的文件级实证**：`D:/repo/rubash/third_party/bash/tests/` 顶层 `*.tests` 文件恰 **83 个**（find 计数）；harness = `D:/repo/rubash/tests/gnu-compat/run-83.sh`（头注释：83-test harness rubash vs GNU Bash over third_party/bash/tests；产物 `target/issue-suites/results/<mode>/`）。`tests/gnu-compat/` 目录本身 23 个条目（README.md、GAPS.md、RESULTS.md、run-83.sh、tests/ 38 个本地冒烟脚本等——不是逐套计数来源，套件口径=上述 83）。

**关联文档**：`D:/repo/rubash/docs/nameref-suite-residual-gnu-race-20261012.md`（竞态归因逐字节论证）。

**跨仓注意（供门户表述）**：`D:/repo/niubash/README.md:108-109` 明确写 "The GNU Bash upstream golden-suite record belongs here too; it returns once the fix currently in flight lands."（niubash README 的 golden 记录**暂撤**等修复）——83/83 数字应挂在 **rubash** 名下，勿直接搬到 niubash。

---

## 4. 六产品最新版本（逐个 gh 查证 2026-10-19）

| 产品 | 最新版本 | 形态 | 证据 |
|---|---|---|---|
| unixwin/**rubash** | **v1.4.0** | latest release（2026-10-13T11:35:18Z）；最新 tag 亦为 v1.4.0 | https://github.com/unixwin/rubash/releases/tag/v1.4.0 ；`gh release view --repo unixwin/rubash` |
| unixwin/**niubash** | **v1.4.0** | latest release（2026-10-14T04:40:41Z）；最新 tag 亦为 v1.4.0 | https://github.com/unixwin/niubash/releases/tag/v1.4.0 ；本地 `D:/repo/niubash/dist/niubash-v1.4.0-win-x64-setup.exe` 在档 |
| unixwin/**WinuxCmd** | **v1.1.15** | latest release（2026-10-19T01:49:53Z）；最新 tag 亦为 v1.1.15 | https://github.com/unixwin/WinuxCmd/releases/tag/v1.1.15 |
| unixwin/**niu-git** | **v2.56.0.1** | 无 release 页，**tag 即版本**；tags 首位 v2.56.0.1（后随 v2.55.0.5/.4/.3/.2…） | `gh api repos/unixwin/niu-git/tags`；tag 对象 989725169a13a8032a8d7a860672943b7a526cc1 |
| unixwin/**wpm-source** | **无版本（索引仓）** | 无 tag、无 release（`gh release view` → "release not found"；tags 空） | 仓描述："Curated WinuxCmd WPM index for standalone Windows command-line binaries"；默认分支 main |
| unixwin/**oh-my-niu** | **v2.0.0** | 最新 tag v2.0.0（前 v1.0.1/v1.0.0）；默认分支 `bundle.toml` `version = "2.0.0"`（:2）一致 | `gh api repos/unixwin/oh-my-niu/tags` + `gh api repos/unixwin/oh-my-niu/contents/bundle.toml` |

**全组织公开仓清单**（`gh repo list unixwin --limit 30`，共 15 仓 = 11 公开 + 4 私有）：

公开（11）：`unixwin.dev`（门户）、`rubash`、`niubash`、`wpm-source`、`WinuxCmd`、`niu-git`、`wpm-artifacts`（"Self-hosted portable binary artifacts for WinuxCmd WPM (mirrors + CI builds, sha256 manifests)"）、`oh-my-niu`、`winuxcmd-i18n`、`wpm-gui`（GUI 前端，pushed 2026-08-21，HIGHLIGHTS 记已评估归档）、`.github`（组织 profile）。
私有（4）：`literate-umbrella-demo-repository`、`demo-repository`、`.github-empty`（"Temporary empty bootstrap repo; safe to delete"）、+1 私有 demo。

---

## 5. README 数字声明清单（每处原文+行号；裁决留给主会话）

### D:/repo/rubash/README.md（EN）
| 行 | 声明 |
|---|---|
| :17 | 83/83 suites pass（2026-10-12 full re-run）：82 suites byte-identical（全文见 §3） |
| :30-31 | Linux WSL 实测 "19/24 byte-identical and climbing" |
| :81-102 | 台账块（83 files / PASS 83/83 100% / Byte-identical 82 / nameref 1 行 / Was 3427 on Sep 9 → −99%+ raw） |
| :118-127 | 扩展表 166/166、559、452/452、140/140、252/252、19/24 |
| :142 | "**40+ builtin implementations**" ← 与 docs/builtins.md 的 62 项口径不一致 |
| — | **无性能倍数声明**（README 无性能节；性能数字在 CHANGELOG 与 research 报告） |

### D:/repo/rubash/README.zh-CN.md（ZH）
:17（83/83、82 逐字节一致）、:28（83 个文件 true-baseline）、:34（通过 83/83 100%）、:36（逐字节一致 82 套件 0 差异）、:45（A/B 41de8319 == 764b9dde）、:47（3427 行 → −99%+）、:54（nameref 第 83 套归因）、:63（"40+ 内建命令实现"）、:23（19/24 字节一致且持续爬升）、:106（全量 83 套件测量命令）。**ZH 无 166/559/452/252 扩展表**（EN 有）——两语 README 内容不对齐，供裁决。

### D:/repo/niubash/README.md（EN）
| 行 | 声明 |
|---|---|
| :32 | "`git --version` starts in **~14 ms** where Git Bash's `git` takes **45-103 ms**" |
| :83-86 | "**6,336** real-world shell assets… verdict: **4,891 OK, 350 slow, 224 that GNU Bash also fails, 101 hangs, 698 that never fetched**" |
| :92-94 | timing baseline loads **437** real oh-my-bash/bash-it assets（**166** themes）+ median of three runs |
| :102-104 | budgets.toml："healthy themes re-render in **11-35 ms**; the budget line is **120 ms**; **5x** over budget is a hard fail" |
| :108-109 | GNU golden-suite record 暂撤声明（见 §3 末） |

### D:/repo/niubash/README-zh.md（ZH）
:59-61（6,336 / 4,891 OK / 350 慢 / 224 / 101 / 698）、:67-68（437 资产 / 166 款主题）、:75-76（11-35 ms / 120 ms / 5 倍硬失败）、:79（golden 记录等修复落地）。ZH 无 git ~14ms 段对应行（该段在 EN :32；ZH 平台支持表在 :32-36 起，未含此数字）。

### D:/repo/WinuxCmd/README.md（补充，与 §1 相关）
:5（banner：**176 commands, 1924 options, 93% differential pass rate (178 cases / 13 tracked platform diffs)**）、:32（176 commands, 1,924 options）、:39（脚注：1,924=OPTION( 宏数；178 cases across **84** commands, 165 pass / 13 diffs）、:74（3.79 MB / ~19 ms cold start / PGO sort −18% nl −17%）、:166/:185（覆盖表：GNU Coreutils **83** commands + findutils/grep/sed 3 commands）。

### 已知的跨文档数字差异（仅列出，不裁决）
1. rubash builtin 数：README "40+"（:142/:63）vs docs/builtins.md "62"。
2. rubash 中英 README 内容不对齐（EN 有扩展表与 Beyond-GNU 节，ZH 无）。
3. Git Bash `git` 启动对照：niubash README "45-103 ms"（EN :32）vs 组织仓描述（gh repo list niubash）"Git Bash's **75-100 ms**"（HIGHLIGHTS.md:54 同 75-100）。
4. WinuxCmd 差分语料："84 commands"（README :39）vs baseline.json 实键 178 cases（corpus 131 cases/67 命令 + regressions 47 条）。
5. niubash README:108 golden 记录暂撤 vs rubash README 83/83 在档——门户引用需分产品。
6. rubash 台账基准 commit 764b9dde 为 2026-10-12 时点；当前远端 master 已到 b79e678a（83 台账数字是 10-12 全量重跑结论，勿写成"当前 master"）。

---

## 附：BENCH 交付物
- `C:/Users/cmx/.zcode/workspace/default/portal-pack/BENCH/`（15 份原样产物 + BENCH-README.md，逐文件路径/mtime/大小/方法见 BENCH-README.md）
- **recheck_fork_20261018-*.tsv 未找到**（D:/repo 全深度、D 盘 5 层、C: Temp、各 worktree、workspace 均已搜，详见 BENCH-README.md「未找到的产物」节）。
- paste_multiline_bench / asset-timing / ttp-bench：ttp 两份日志已入包；paste_multiline 与 asset-timing 未找到落盘结果文件（只有脚本与基线夹具，见 BENCH-README.md「相关但未拷入的说明」）。
