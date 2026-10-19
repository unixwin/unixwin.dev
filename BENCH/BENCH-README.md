# BENCH-README — 基准产物清单与环境说明

> 采集日期：2026-10-19。本目录为**原样拷贝**的实测产物（未改动数字、未四舍五入）。
> 每条列：原始路径 / mtime / 大小 / 环境与方法（仅转述产物文件或生成脚本里注明的内容，未注明处标「未记录」）。

## 测量宿主环境（采集时实测）

- CPU：Intel(R) Xeon(R) w5-3433（`wmic cpu get name`，2026-10-19）
- OS：Microsoft Windows 10 专业版，10.0.19045 Build 19045（`systeminfo`；`ver` 显示 10.0.19045.6466）
- 物理内存：65,214 MB（systeminfo）
- 同机 WSL2：Ubuntu-GitLab（VERSION 2，内核 6.18.33.2-microsoft-standard-WSL2，Ubuntu 24.04，32 vCPU）——转述自 `unix-spawn-cost-20261012.md` 与 `nvm-hang-verify-20261012.md` 的环境节
- GNU 对照：WSL GNU Bash 5.3.0(1)-release x86_64-pc-linux-gnu（`/usr/local/bin/bash`，owner 编译）；Git Bash GNU Bash 5.3.0(1)-release x86_64-pc-msys（`/usr/bin/bash`）
- rubash 主检出（D:/repo/rubash）：分支 design/1.5.0-workspace-engine-api @ 615ea4f4；本地 master @ 98794cb7（各产物对应的 commit 见下表，产物内未注明处标「未记录」）

## 未找到的产物

- **`recheck_fork_20261018-*.tsv`：未找到。** 已搜索：D:/repo 全深度 `*recheck*`、D 盘 5 层深度 `recheck_fork*`、C:/Users/cmx/AppData/Local/Temp、.zcode/workspace、各 rubash/niubash worktree（含 Temp/opencode 与 D:/repo/rubash-wt795、niubash-forkstudy 的 fork-wt/master-wt）。文件名含 "20261018" 的文件仅有 bgwait 调查目录与 worktree-rescue-20261018（补丁文件）。如该产物应由某在飞代理产出，需待其落盘后补拷。

## 文件清单（15 份）

### 1. PERF-TABLE.md
- 原路径：`D:/repo/research/perf-run/target/perf-results/PERF-TABLE.md`
- mtime：2026-10-12 09:09:43 +0800；大小：1,434 字节
- 内容：25 探针 rubash vs GNU 倍率表（含 20-as-fn-mkdir-p-rep40、23-nvm-parse-n、24-nvm-load）。文件头自注：rubash=`5.3.0(1)-release (x86_64-pc-msys)`，GNU=`5.3.0(1)-release (x86_64-pc-linux-gnu)`，**commit: unknown**，generated 2026-10-12T01:09:39Z。24-nvm-load rubash 侧 TIMEOUT。
- 方法（转述自 `D:/repo/rubash/scripts/run-perf-suite.sh` 头注释，该脚本输出即本表）：每探针 1 次校验跑（rc 门）+ N 次计时跑，`date +%s%N` 墙钟，报中位数，timeout(1) 封顶；GNU 侧在 WSL 内以 --inner 重入计时（wsl.exe 往返不进数字）；不用 hyperfine；状态 OK/RCn/TIMEOUT。

### 2. rubash.tsv
- 原路径：`D:/repo/research/perf-run/target/perf-results/rubash.tsv`
- mtime：2026-10-12 09:09:38 +0800；大小：1,138 字节
- 文件头自注：exe `/d/repo/rubash/target/release/rubash.exe`（10,390,528 字节）、**commit unknown**、uname MSYS_NT-10.0-19045、date 2026-10-12T00:40:57Z。各探针 runs=3 或 5（行末倒数第二列）。24-nvm-load TIMEOUT rc=124。

### 3. gnu.tsv
- 原路径：`D:/repo/research/perf-run/target/perf-results/gnu.tsv`
- mtime：2026-10-12 08:53:55 +0800；大小：1,023 字节
- 文件头自注：GNU bash 5.3.0(1)-release (x86_64-pc-linux-gnu)、Linux 6.18.33.2-microsoft-standard-WSL2。

### 4. results.tsv（bgwait）
- 原路径：`D:/repo/research/bgwait-20261018/results.tsv`
- mtime：2026-10-19 02:22:42 +0800；大小：2,294 字节
- 内容：8 工作负载 × 3 轮 × 3 runner（rubash / gnu_msys / gnu_wsl）inner/outer ms。
- 环境（转述自同目录 `run_bench.sh` 与 `D:/repo/research/bgwait-investigation-20261018.md`）：rubash=worktree `D:/repo/rubash-wt-809/target/release/rubash-clean-fixed.exe`（master 8ab35e89 含 #807/#808）；GNU msys=/usr/bin/bash 5.3.0 同机原生；GNU wsl=wsl.exe Ubuntu-GitLab。
- 方法（run_bench.sh 头注释原文）：交错轮换（每轮 rubash → gnu-msys → gnu-wsl），弃 1 轮热身后 min-of-3，逐跑 timeout 120s，inner-window `date +%s%N`，三方同一计时法。

### 5. startup.tsv（bgwait）
- 原路径：`D:/repo/research/bgwait-20261018/startup.tsv`
- mtime：2026-10-19 02:20:36 +0800；大小：226 字节
- 内容：3 runner × 5 次 startup_ms（rubash 27-48ms，gnu_msys 60-93ms，gnu_wsl 202-278ms）。方法未在本文件注明（同 run_bench.sh 套件产出）。

### 6. run_bench.sh（bgwait 生成脚本，方法证据）
- 原路径：`D:/repo/research/bgwait-20261018/run_bench.sh`
- mtime：2026-10-19 02:20:09 +0800；大小：3,579 字节
- 附带拷入以证明方法声明（头注释见第 4 条）。

### 7. results-windows-native.tsv（nvm 挂起核查矩阵·Windows 原生格）
- 原路径：`C:/Users/cmx/AppData/Local/Temp/nvm-hang-verify/results-windows-native.tsv`
- mtime：2026-10-12 09:41:39 +0800；大小：525 字节
- 内容：41de8319 主树 exe 4 格（2×TIMEOUT ~60s、2×RC127 路径错）。方法/守卫转述自 `nvm-hang-verify-20261012.md`：WSL GNU `timeout -k 5 60` 守卫、stdin=/dev/null、与 run-perf-suite.sh harness 对齐。

### 8. results-windows.tsv（nvm 核查矩阵·Windows 原生 6 格）
- 原路径：`C:/Users/cmx/AppData/Local/Temp/nvm-hang-verify/results-windows.tsv`
- mtime：2026-10-12 09:49:58 +0800；大小：466 字节
- 内容：41de8319 与 764b9dde 两构建 × 干净/污染 env × tmp cwd，全 TIMEOUT ~60s。

### 9. results-linux.tsv（nvm 核查矩阵·WSL2 Linux 原生 10 格）
- 原路径：`C:/Users/cmx/AppData/Local/Temp/nvm-hang-verify/results-linux.tsv`
- mtime：2026-10-12 09:44:01 +0800；大小：1,141 字节
- 内容：rubash 41de8319/764b9dde Linux 原生 clean tmp 均 OK（459/401ms）；GNU 5.3.0 对照 116ms；PWD 形态强制格挂死（GNU 平价证明）。

### 10. ttp_master.log（niu TTP 基准·基线构建）
- 原路径：`C:/Users/cmx/AppData/Local/Temp/ttp_master.log`
- mtime：2026-10-19 00:20:57 +0800；大小：747 字节
- 文件头自注：niu 二进制 `...\nb373-base-target\release\niu.exe`，bash=`D:\Git\bin\bash.exe`，**runs: 5 (median of TTP spawn->'P1> ', ConPTY transport floor included on both sides)**。niu median 3164.5ms vs bash 3260.2ms，附 NIU_TRACE_STARTUP 分段归因。构建对应 commit：未记录（日志只记 target 目录名）。

### 11. ttp_fix.log（niu TTP 基准·修复构建）
- 原路径：`C:/Users/cmx/AppData/Local/Temp/ttp_fix.log`
- mtime：2026-10-19 00:21:56 +0800；大小：742 字节
- 同法：niu median 3139.8ms vs bash 3289.3ms；启动归因 config→Shell::new 共 136.6ms。

### 12. unix-spawn-cost-20261012.md（测量报告）
- 原路径：`D:/repo/research/unix-spawn-cost-20261012.md`
- mtime：2026-10-12 09:11:06 +0800；大小：5,641 字节
- 环境/方法（文件内自注）：rubash Linux 二进制 WSL 内独立构建（源码=D:/repo/rubash@1.4.0，cargo 1.98.1 release）；**所有数字 min-of-3**；WSL2 噪声 ±15%；spawn 开销=1000 次循环三方同脚本。

### 13. sample.tsv（spawn 点覆盖抽样清单）
- 原路径：`D:/repo/research/unix-spawn-cost/sample.tsv`
- mtime：2026-10-12 08:58:21 +0800；大小：24,094 字节
- 内容：生态资产确定性抽样（每 52 条取 1 → 201 条，178 有效）的 pinned source_url 列表（unix-spawn-cost 报告 §3 的原始样本）。

### 14. nvm-hang-verify-20261012.md（核查报告）
- 原路径：`D:/repo/research/nvm-hang-verify-20261012.md`
- mtime：2026-10-12 09:57:18 +0800；大小：10,560 字节
- 内容：nvm.sh v0.40.8（5,226 行）载入的 8+8+对照格矩阵；结论=Windows 原生空 NVM_DIR 形态 P0 挂起（issue #537），Linux 原生正常，GNU 自身在强制 PWD 下同挂（PWD 形态是分歧点）。

### 15. bgwait-investigation-20261018.md（调查报告）
- 原路径：`D:/repo/research/bgwait-investigation-20261018.md`
- mtime：2026-10-19 03:30:43 +0800；大小：17,884 字节
- 环境（文件内自注）：Windows 10.0.19045 x64 32 逻辑核（宿主有并行负载），交错轮换 + min-of-3 + timeout 120s；rubash=master 8ab35e89 worktree，修复 commit 28744c8d。

## 相关但未拷入的说明

- **paste_multiline_bench**：仅有脚本 `D:/repo/niubash/scripts/perf/paste_multiline_bench.py`（mtime 2026-10-13 11:17，17,133 字节），**未找到落盘的结果文件**（脚本输出走 stdout/--json）。脚本 docstring 自注校准契约：257 行载荷端到端从 >300s（超时）降到 ~4.6s（CHANGELOG 1.4.0 / niubash#252）。门户引用该数字时口径=CHANGELOG/脚本契约，非本包内产物。
- **asset-timing**：仅基线夹具 `D:/repo/niubash/scripts/perf/baselines/asset-timing-baseline.json`（mtime 2026-10-04 18:28，597,021 字节，为回归基线而非测量结果），未拷入。
- **recheck_fork_20261018-\*.tsv**：未找到（见上）。
