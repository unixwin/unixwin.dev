# bgwait（`sleep & wait`）2.47x 退化 — Windows 侧机制调查报告

- **票**: rubash#809（Android/Termux bgwait_750 2.47x 慢）；关联 niubash#349/#352、#680、#737、#229
- **日期**: 2026-10-18/19
- **调查环境**: Windows 10.0.19045 x64（32 逻辑核，宿主有并行负载，全部数据点 = 交错轮换 + min-of-3 + 逐条 timeout 120s，inner-window `date +%s%N` 计时）
- **对照三方**: rubash（worktree D:/repo/rubash-wt-809，master 8ab35e89，含 #807/#808）、GNU bash 5.3.0 x86_64-pc-msys（/usr/bin/bash，同机原生）、GNU bash 5.3.0 x86_64 WSL2 Ubuntu-GitLab（原生 Linux fork 地板参照）
- **工作负载**: `i=0; while [ $i -lt N ]; do sleep 0 & i=$((i+1)); done; wait` 及分解变体
- **结论先行**: Windows 复现了**引擎侧机制**（每个 `&` 作业 = 一次 rubash 包装进程 respawn + 完整 shell init + 一次 sleep spawn，两次进程创建 vs GNU 的一次 fork+exec），已定位并修复（`fix/809-bgwait-direct-spawn`，commit 28744c8d）；但 Windows 的墙钟时间被 (a) 32 核并发掩盖、(b) CreateProcessW ~2.2ms/个的**平台地板**吸收，Windows 上 base↔fixed 打平（1691 vs 1696ms/750）。Android（6 核 + bionic fork 税 ∝ RSS，#680）的 2.47x 正是该机制未被掩盖的部分——设备复测清单见 §7。

---

## 1. Windows 基准数据

### 1.1 三方矩阵（min-of-3，inner ms，clean build fixed / base 为修复前同法测得）

| workload | rubash **fixed** | rubash base | GNU msys（同机） | GNU WSL2（fork 地板） | fixed/WSL |
| --- | --- | --- | --- | --- | --- |
| **bgwait750**（`sleep 0 &`×750+wait） | **1696** | 1691 | 1967 | **154** | 11.0x |
| bgwait1500 | 3366 | 3355 | 3980 | 324 | 10.4x |
| bgwait300 | 694 | 700 | 814 | 57 | 12.2x |
| bgwait100 | 263 | 240 | 298 | 19 | — |
| bgspawnonly750（无 wait） | 1696 | 1654 | 2119 | 158 | — |
| bgsubshell750（`( : ) &`×750，走包装路径） | 1643 | 1707 | 2192 | 123 | 13.4x |
| fgext750（前台 `sleep 0`×750）※ | 37 | 39 | 41 | 857 | 0.04x |
| loop750（纯 `i=$((i+1))` 循环） | 32 | 33 | 40 | 3 | 10.7x |
| 启动（`-c exit`，min-of-5） | 31 | — | 63 | 207 | — |

※ 前台 `sleep` 在 rubash 是**进程内 fast-path builtin**（`command_dispatch_primary.rs:137`，`sleep_interruptibly`，无 spawn）——fgext **不是** spawn 基准，只对照 GNU 的真实 fork+exec（WSL 857ms = 1.14ms/job）。

关键读数：
- **bgwait 与 bgspawnonly 打平**（1696 vs 1696）→ wait/回收侧无成本，**成本全在 spawn 侧**。
- **WSL GNU = 154ms（0.21ms/job）**，rubash-fixed = 2.26ms/job——方向与 Android 一致（rubash 慢），幅度更大（Windows 平台地板更高）。
- **rubash-fixed 1696 < GNU-msys 1967**：同机原生对比 rubash 已**快于** msys GNU（msys fork 模拟更贵）。
- **loop750 = 32ms vs WSL 3ms**：`-c` 算术循环每迭代 ~43µs vs 4µs，即 #349 族的循环开销残差（#607/#608/#609 已修引擎侧，设备复测确认收敛幅度，见 §7.3）。

### 1.2 交错 base↔fixed 差分（同进程内交错，min-of-3）

| workload | base | fixed | Δ |
| --- | --- | --- | --- |
| bgwait750 | 1622 | 1789 | +10% |
| bgspawnonly750 | 1613 | 1807 | +12% |
| bgsubshell750（未改动路径） | 1670 | 1667 | 0%（sanity） |
| fgext750（未改动路径） | 38 | 39 | 0%（sanity） |

fixed 在 Windows 微基准上 **~+10%**：包装路径把第二次 spawn（wrapper 子进程在自己的核上 init + spawn sleep）与父循环**并发掩盖**了；direct 路径把同样的 env(0.25ms)+spawn(~2ms) **串行**进了父进程。最终 clean-build 全矩阵交错轮换下两者打平（1691/1696）——波动来自宿主并行负载（另一会话同时在跑 cargo）。

### 1.3 N 曲线（fixed，单轮）

n=25→94ms(3.8ms/job)、n=50→152(3.0)、n=100→253(2.5)、n=200→496(2.5)、n=400→944(2.4)、n=800→1828(2.3)。
**线性、无 O(N²) 项**；~2.3ms/job + 每进程固定 ~35-40ms（启动+parse+wait 边界）。作业表簿记（`register_process` BTreeMap、`set_current_job` O(1) 均摊、`remove_job_by_pid_preserve_status`）在profile 中合计 <40ms/750，非瓶颈。

### 1.4 插桩分解（RUBASH_BG_DEBUG 临时计时，已移除）

父进程每个 `&`：
- `execute_background_ast_command` env_map 构建 0.17-0.44ms（`std::env::vars()` + BTreeMap + UTF-16 块）
- stdio handle 复制 ~30-70µs
- `spawn_whitelisted`（CreateProcessW + PROC_THREAD_ATTRIBUTE_HANDLE_LIST）**1.5-4.1ms**，其中 CreateProcessW 本体 1.5-4.0ms、attr list <4µs
- 包装子进程自身寿命 ≈ 2ms（CreateProcess）+ rubash init（冷启动 31ms min，热路径上与其余并发）
- **std::process::Command::spawn 与 spawn_whitelisted 同价（~2ms）**——Windows 上 `CreateProcessW` 成本与镜像大小、机制基本无关，**~2.2ms/个就是平台地板**；前台 52µs 的 fgext 是进程内 fast-path，不是 spawn。

---

## 2. 代码面分析（机制定位）

### 2.1 spawn 侧（罪魁）

- `src/executor/ast_exec.rs:958-959` — 所有 `BackgroundCommand` 一律进 `execute_background_ast_command`，**没有简单命令快径**。
- `src/executor/compound_exec.rs:327 execute_background_ast_command` — 每个后台作业（包括 `sleep 0 &` 这种裸外部命令）构造 `spawn_args = ["-c", source]`（:460）并以 `spawn_whitelisted`（:650，STARTUPINFOEXW + HANDLE_LIST，`src/fd/windows_impl.rs:1271`）**respawn 一个完整 rubash 进程**作包装子壳；包装子进程再 init、re-parse、按前台路径 spawn 真正的 sleep。
- GNU 对应行为：`execute_connection '&'` fork 后，子进程 `execute_simple_command` 对外部命令直接 `shell_execve` —— **fork+exec 一次，无残留子壳**。rubash 的包装 = 每作业多付一次进程创建 + 完整 init（PATH 扫描、builtins 表、env 处理）。Android 上 bionic fork 税 ∝ RSS（#680），wrapper 是 10MB+ 的 shell 镜像 → 这就是 2.47x 的引擎半边。

### 2.2 wait/回收侧（无嫌疑）

- `src/executor/job_builtins.rs:553/670 refresh_background_jobs*` — 顶层命令边界 try_wait 全部活子（ast_exec.rs:520-531），profile 实测 750 作业仅 ~40ms。
- 无操作数 `wait`（job_builtins.rs:290-321）逐 pid `wait_for_background_pid`（:877）：completed_statuses 缓存命中 → 直接消费；未死子进程 5ms 轮询（:941）。子进程先于 wait 死亡时无轮询惩罚。
- `src/jobs/table.rs` — BTreeMap/HashMap 簿记，O(log n)/作业，实测占比可忽略。

### 2.3 #737 / #807 回归审计（按任务要求）

- **#737（kill 后台子进程，6e3d9e9a + 2b960063，PR #790）**: `compound_exec.rs` 仅加一个 `__RUBASH_BACKGROUND_WRAPPER=1` env 写入；unix 侧 `child_pre_exec_reset`（`src/builtins/kill.rs:1956-1980`）加一次 `std::env::var` 读 + `prctl(PR_SET_PDEATHSIG)`（仅当 wrapper 标记置位）。**每 spawn 一次 O(µs) env 写 + 一次 env 读，无额外簿记**。其余为 pipeline_exec 的 cfg(unix) 门控放开（shell-writer pipeline），不在后台作业路径。
- **#807（200771b1，PR #807）**: source 的 DEBUG entry trap 作用域（trap 表成员判定）+ PROMPT_COMMAND `$_`——**完全不触碰后台作业簿记**。
- 结论：两票修复**均未引入** bgwait 面的簿记开销。

---

## 3. 修复（Windows 确认引擎开销 → 已落库）

**分支 `fix/809-bgwait-direct-spawn`（worktree D:/repo/rubash-wt-809），commit 28744c8d，仅 `src/executor/compound_exec.rs` +193 行。**

GNU 语义锚点：async **简单命令** = fork+exec，无残留子壳（execute_cmd.c:5562+ → execute_simple_command → shell_execve）。因此为 `&` 体是**裸外部命令**的情形直接 exec 外部程序，其余全部保持包装路径不变：

Gate（`background_direct_external_command`，全满足才走直 spawn）：
- 纯简单命令：无 pipe/pipeline/and_or/time/嵌套 background/inverted/subshell/for/if/while/until/[[/case/select/function/{}/coproc；
- 无 assignments/compound_assignments/array_element_assignments（tempenv 属于 GNU 的 fork 子进程）；
- 无任何 redirects/heredoc/here-string（async fd0 规则由既有 `resolve_background_stdio` 统一处理：无 job control 时 fd0→/dev/null，GNU async_redirect_stdin 对齐）；
- 无 process substitutions（物料化管线归前台路径）；
- 非 xtrace（`set -x` 下保持包装路径，trace 输出形状不变）、非 capture-pipe 作用域（#169 捕获登记不缺位）；
- 展开失败（含 nounset 边带）→ 回退包装；展开后首词非 %jobspec/内建（含特殊内建）/函数/别名；
- `find_user_command` PATH 解析失败 → 回退包装（子进程侧 "command not found" 行为不变）；`should_run_with_shell` 脚本回退 → 回退包装。

直 spawn 细节：
- `std::process::Command` + `resolve_background_stdio` 三路 stdio（Inherit/Null/File→Stdio::from）；
- `apply_external_environment`（与前台外部完全同一 env 应用，含 TMPDIR Windows 边界）；
- unix 侧挂 `child_pre_exec_reset` pre_exec（#229 信号处置复位）；**不带** `__RUBASH_BACKGROUND_WRAPPER` → #737 的 PDEATHSIG 不适用（直 exec 的异步子进程随 shell 退出而存活，GNU 同）；Windows 侧走 bInheritHandles 继承（与前台外部同暴露面；capture 已被 gate 排除）；
- 登记同形状：`background_children` + `register_process(pid, 命令文本, background=true)` + `set_job_control(monitor)` + `last_background_pid` → **$! = 外部进程 pid（正是 GNU 的值）**，`wait $!`/`kill $!`/`jobs`/通知（#229）全走既有路径；清 `last_command_substitution_status` 边带（GNU 中展开发生在 exec 子进程，不泄漏进父）。

效果：`sleep 0 &` 从「spawn rubash(2ms) + init + spawn sleep」变为「spawn sleep 一次」；包装路径（函数/复合/重定向/内建后台）行为逐字节不变。

## 4. 回归证据（差分）

- **30 项后台语义一致性 battery**（wait/kill/信号状态/`wait -n`/函数与子壳包装/tempenv/重定向/xtrace/别名/procsub/disown/CHLD trap/EXIT trap/capture……）base vs fixed **输出逐字节一致**（`bg_conformance.sh`，out-base.txt vs out-fixed2.txt 无 diff）。
- **executor_tests::command_chaining 全量**（1526 tests）：fixed 1517 passed / 9 failed = **baseline 同一 9 个失败集**（Windows 预存：cd/pwd、command -v PATH、kill %jobspec 通知时序等，stash 验证）。
- **regression + traps×4 + background×3 + cli_tests sweep**：fixed 23 failed = **baseline 同一 23 个**（examples/fd_redirects/tilde_user/coproc retire 等 Windows 预存），失败集合 diff 为空。
- 构建：`cargo build --release` 干净；`cargo fmt` 应用；插桩全部移除（windows_impl.rs 零 diff）。

## 5. 结论

1. **Windows 上确认引擎侧开销为真**，且精确定位：`&` 的包装 respawn（第二进程 + 完整 init），不是作业表/pid 回收/状态轮询（这些合计 <40ms/750）。#737/#807 未引入额外簿记。
2. Windows 同时存在**平台地板**：CreateProcessW ~2.2ms/个，与镜像、机制无关 → bgwait 的墙钟被地板吸收：fixed 在 Windows 与 base 打平（1691 vs 1696 min-of-3），并已**快于同机 msys GNU**（1967）。+10% 的串行化微差被交错轮换的 clean 矩阵抹平。
3. **Android 的 2.47x = 同一引擎机制 × bionic 平台参数**（fork 税 ∝ RSS，6 核无法掩盖每作业一次 10MB+ 镜像的 fork+init）。修复移除该机制后，预期 bgwait 逼近「一次 sleep fork+exec + 循环开销」，即从 2293ms 向 GNU 928ms 的 1.0-1.6x 区间收敛；若仍有残差，残差归属 = bionic spawn 地板 + #349 族 `-c` 循环开销（Windows 残差 43µs/迭代 vs WSL 4µs）。
4. 语义收益（跨平台）：`$!` 即真实 worker pid（GNU 值），`kill $!` 直接作用于 worker，#737 的 PDEATHSIG 间接层在该形状下不再产生孤儿问题。

## 6. #352 矩阵框架修正（账本分栏）

按票内修正方向，fork 面与内联面分开记账：
- **真 fork/exec 面**（cmdsub/bsub/subshell/bgwait/extloop）：rubash 的优势来自无 fork 的进程内求值 +（本修复后）单次 spawn 的后台路径；bgwait 行修复前是**真退化**，修复后 Windows 侧位于平台地板。
- **内联记账面**（pipe/mkdir/real 行）：rubash 的 echo|cat 190x、mkdir 无 fork 是**进程内 coreutils 内联**（`external_file_builtins.rs:14-34`、`pipeline_exec.rs` 内联臂），不是 fork 节省——#352 旧矩阵该两行需重贴标签。

## 7. Android 复测清单（tablet，Termux/aarch64）

前置：宿主负载 ≤2/6 核；同一平板、同 GNU bash 5.3.20-aarch64 对照；方法 = 交错轮换 + min-of-3 + 逐条 timeout；产物落 `~/bench_niu/recheck/recheck_bgwait_<ts>.tsv`（列：workload,shell,round,inner_ms,rc）。

### 7.1 构建
```sh
cd ~/src/rubash && git fetch origin && git checkout fix/809-bgwait-direct-spawn
git log --oneline -1   # 须含 28744c8d perf(executor): exec background simple externals directly
cargo build --release  # Termux 下按现行发布流程；记录 --version 自报串
./target/release/rubash -c 'sleep 5 & jobs -l; pid=$!; kill $pid; wait; echo rc=$?'
# 期望：jobs 显示的 pid 即 sleep 的 pid（ps | grep sleep 可核对）；kill 后 wait 打印 143
```

### 7.2 基准命令（与 20261018 复测同形状）
```sh
# bgwait_750（票面 workload）
rubash -c 't0=$(date +%s%N); i=0; while [ $i -lt 750 ]; do sleep 0 & i=$((i+1)); done; wait; t1=$(date +%s%N); echo $(( (t1-t0)/1000000 ))'
# GNU 对照
bash  -c '同上'
# 分解变体（定位残差归属）
bgspawnonly750: '…; done'                     # 去 wait → spawn 侧
bgsubshell750:  '… ( : ) & …; wait'           # 包装路径（应与修复前持平）
fgext750:       '… sleep 0; …'                # 前台（真 fork 面）
loop750:        '… i=$((i+1)); …'             # -c 循环开销（#349 族）
```
每条 rubash/GNU 交错 × 3 轮取 min；timeout 60s/条。

### 7.3 判定阈值
| 指标 | 修复前 | 判定 |
| --- | --- | --- |
| bgwait_750 rub/bash 比 | 2.47x | **≤1.6x = 达标收敛**；≤1.3x = 优秀（近地板）；仍 ≥2x = 未收敛，转 §7.4 |
| bgsubshell_750 | ~与修复前持平 | 应持平（包装路径未动）；若恶化 = 回归，停 |
| fgext_750 / extloop_2000 | 1.01x 平价 | 应保持平价 |
| loop_750（#349/#352 复测） | — | 顺带复测：对照 #607/#608/#609 修复后的收敛幅度，回报到 #349/#352 |
| 语义抽查 | — | `kill $!`→143、`wait $!`、`jobs -l` pid=真实 sleep、后台函数/复合仍走包装且行为不变 |

### 7.4 若仍 ≥2x 的定位手段
```sh
RUBASH_EXEC_PROFILE=1 rubash -c '<bgwait_750>' 2>&1 | tail -1
# 看 jobs=（回收/刷新）、chain=（每命令匹配链）、dispatch/matcmd 分解；
# bgwait 与 bgspawnonly 再比一次：若 spawnonly≈bgwait → 仍在 spawn 侧（bionic 地板+残余包装）；
# 若 wait 显著 → 回收侧回归。
```
并记录 `cat /proc/<rubash>/status | grep VmRSS`（#680 fork 税 ∝ RSS 的直接证据）。

## 8. CR 复审轮 2（2026-10-19，commit 221e007e，已推送 origin）

CR findings F1/F2（must）+ N1/N2/N3 全部落地：

- **F1 受限 shell**：gate 首臂 `restricted` 置位即回退包装（execute_prepared_command → restricted_command_error 的拒绝语义保持在原处）。实测 `set -r; /usr/bin/touch … & wait` 双方均报 `restricted: cannot specify '/' in command names`。
- **F2 父进程展开**：gate 在展开前扫描 word_metadata.raw——含 `$(` / 反引号 / `:=` / 赋值型花括号参数展开（`parameter_expansion_assigns` 扫描；结构化 parameter_expansions 节点本 parser 不填充）即回退包装。三回归反转实测（fixed）：`echo $(echo tick >> log) &` → log 1 行（base 1 行）；`${FOO:=0.05}`/`${FOO=0.05}` → 父 FOO=[UNSET]（base 同）；`sleep $(sleep 1; echo 0.1) &` 父 spawn 时延 ~45ms（base ~45ms；修复前 fixed 阻塞 ~1030ms）。`${x:-v}` 读取型保持快径。
- **N1**：gate 移到 wrapper-only 的 exe 解析/env_map 构建（0.17-0.44ms）之前，直 spawn 不再白付。
- **N2**：fd_table 存在活 fd≥3 项（持久 `exec 3<file`，#180）即回退包装（经 __RUBASH_FD_* 通道转发）；直 spawn 不再丢 fd≥3。battery 实测 `exec 3>f; echo hi >&3 & wait` base/fixed 同输出 `hi`。
- **N3**：battery 扩至 37 探针（+F1/F2 四 shape + `$!` 镜像名探针）。base↔fixed 唯一差异 = `dollar-bang-real-pid`：base `bgname=rubash-base.exe`（wrapper）→ fixed `bgname=sleep.exe`（真实 worker，GNU 对齐）——预期语义改进，其余 36 项逐字节一致。
- **回归**：command_chaining 1517 passed / 9 pre-existing；后台/信号/traps 套件全绿；负载受控窗口 bgwait750 min-of-4 base 1664 vs fixed 1658（打平）。

## 9. 产物索引

- 报告: `D:/repo/research/bgwait-investigation-20261018.md`（本文件）
- 修复分支: `D:/repo/rubash-wt-809`，`fix/809-bgwait-direct-spawn` @ 28744c8d
- 基准脚本/数据: `D:/repo/research/bgwait-20261018/`（run_bench.sh、differential.sh、bg_conformance.sh、results.tsv（final matrix）、results_wsl.tsv、differential.tsv、startup.tsv、out-base.txt/out-fixed2.txt、sweep-{base,fixed}-failures.txt、rubash-{base,fixed,clean-fixed}.exe）
- 关键 file:line：`compound_exec.rs:327`（包装路径）、`compound_exec.rs:650`（包装 spawn_whitelisted）、`compound_exec.rs:445-541`（直 spawn 快径+gate 调用点）、`compound_exec.rs:698`（gate 方法）、`ast_exec.rs:958`（BackgroundCommand 路由）、`job_builtins.rs:553/877`（refresh/wait 轮询）、`fd/windows_impl.rs:1271`（spawn_whitelisted）、`command_dispatch_primary.rs:137`（前台 sleep fast-path）
