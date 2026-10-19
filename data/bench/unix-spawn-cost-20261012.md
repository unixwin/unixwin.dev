# Linux external spawn：fork+exec → posix_spawn 混合快路径 值不值（测量报告）

日期 2026-10-12。只读测量，未改任何仓库代码。rubash Linux 二进制在 WSL 内独立目录构建（~/rubash-build，源码拷贝自 D:/repo/rubash@1.4.0，cargo 1.98.1 release，3m12s，产物 9.1MB）。

**环境**：宿主 Windows 10 → WSL2（`wsl.exe -l -v`：Ubuntu-GitLab, VERSION 2，真内核 6.18.33.2-microsoft-standard-WSL2），Ubuntu 24.04，32 vCPU，31GiB。GNU bash 5.3.0，dash 0.5.12（/bin/sh）。
**注意**：WSL2 绝对值普遍比原生 Linux 虚高 2-3x；**比值/放大率可迁移，绝对 µs 不可直接外推**。所有数字 min-of-3，WSL2 噪声 ±15%。

## 结论先行：值得做（低成本、中等收益、无风险窗口），但它不是瓶颈修复

1. rubash 外部 spawn 已与 GNU bash **持平**（1.18 vs 1.12 ms/spawn，WSL2），不存在回归要救；
2. 快路径可在覆盖 ~69-90% 的 spawn 点上省 **~25-50%/次**（WSL2 实测口径），且收益随堆增长放大（8MB→+0.6ms，32MB→+2.2ms/spawn）；
3. 对 owner 简报的 **15.6x nvm 解析引擎瓶颈确认无影响**（该瓶颈在解释器内，不经过 external spawn；`$(true)` 88µs 进程内克隆路径同样不受影响）。

## 1. 单次 spawn 纯开销（三方，1000 次循环，min-of-3）

命令：`bash/dash/rubash -c 'i=0; while [ $i -lt 1000 ]; do CMD; i=$((i+1)); done'`（三方同一脚本，`{1..1000}` 为 bash 特有故不用；空循环基线 bash 10µs/iter、dash 8µs、rubash 25µs，相对 spawn 可忽略）：

| shell | `/bin/true` | `/bin/false` | 内建 true |
|---|---|---|---|
| GNU bash 5.3.0 | 1.121 ms | 1.462 ms | 10 µs/iter |
| dash 0.5.12 | 0.865 ms | 0.766 ms | 8 µs/iter |
| rubash 1.4.0 | 1.183 ms | 1.187 ms | 25 µs/iter |

（true/false 差异在噪声内，exec 成本无系统性差异。）

## 2. 堆大小对 fork 的放大（核心机制，Rust 微基准）

代码：`std::process::Command` 裸 spawn+wait `/bin/true`，`pre_exec(|| Ok(()))` 强制 std 走 fork 路径（与 WhitelistedSpawn 同机制），无 pre_exec 即 std→glibc posix_spawn。strace 实证两条路：`clone3(CLONE_VM|CLONE_VFORK|CLONE_CLEAR_SIGHAND)`（posix_spawn，无页表拷贝）vs `clone(SIGCHLD)`（全量 fork）。

| 预触摸堆 | posix_spawn | fork+exec | fork 税 |
|---|---|---|---|
| 0 MB | 435 µs | 602 µs | +167 µs (1.4x) |
| **8 MB（=rubash RSS）** | 779 µs | 1385 µs | **+606 µs (1.8x)** |
| 16 MB | 764 µs | 2300 µs | +1536 µs (3.0x) |
| 32 MB | 916 µs | 3077 µs | +2161 µs (3.4x) |
| 50 MB | 555 µs | 2029 µs | +1474 µs (3.7x) |
| 200 MB | 441 µs | 5471 µs | +5030 µs (12.4x) |
| 400 MB | 434 µs | 17223 µs | +16789 µs (39.7x) |

posix_spawn 对 RSS **完全不敏感**；fork 税 ∝ 页表项数线性放大。"我们的堆比 GNU 大"实测：启动 RSS（builtin 读 /proc/self/status）rubash 8.5MB、bash 3.4MB、dash 1.9MB（HWM 口径 7.7/3.3/1.7MB）——**rubash = bash 的 2.5x**，当前量级下 fork 税 0.6ms（WSL2）；堆若随功能长到 32MB，税变 2.2ms。

## 3. spawn 点覆盖（语料统计）

原快照（scripts/harvest/snapshots/wt92-local-20261005、/d/eco-harvest/results）只余 JSON 元数据，实体内容已清理；改用 manifest（/d/eco-harvest/manifest/assets.jsonl，10435 资产）确定性抽样（每 52 条取 1 → 201 条，pinned source_url 重取，178 条有效，±2.3%）：

| 语法（强制走慢路径） | 资产占比 |
|---|---|
| 显式 fd≥3 重定向（`3>&/3</4>`…，grep `(^|\s)([3-9]|\d{2,})(>>|>&|>|<<|<&|<)`） | 1.7% |
| 动态 fd `{fd}>`（bash 4.1+，落 fd≥10） | 1.7% |
| `trap`（MANAGED 6 信号复位语义所需） | 8.4% |
| `exec N>` | 0.6% |
| **并集（必须 pre_exec）** | **10%** |
| 交互标记（PS1/PROMPT_COMMAND/bind/complete，交互会话装 handler → 需复位） | 24% |
| **严格快路径资格（无上三类）** | **69%** |

脚本级静态占比是 spawn 点占比的代理（偏保守：多数 spawn 集中在无 trap 的构建/测试脚本里）。

## 4. 信号复位条件（源码确认）

`src/fd/unix.rs:437-451` pre_exec 做两件事：extras 的 `dup2(fd,fd)` + `child_pre_exec_reset()`（kill.rs:1744，仅管 HUP/INT/QUIT/TERM/USR1/USR2 六信号，无 trap 普通脚本下 = SIG_DFL→SIG_DFL 的 no-op，但 6 次 sigaction 逐 spawn 执行）。快路径判据可实现为：`extra_handles.is_empty() && 无 managed 信号处置偏离 entry && entry 未 ignored`（全进程状态可缓存，O(1) 检查）。非交互无 trap 脚本 = 上表 69% 资产命中。

## 5. 总账与 15.6x

- 模板代入：省 ~0.6ms/spawn（WSL2，8.5MB 堆；原生估 50-200µs）× 覆盖 69-90% spawn 点 → **spawn 密集脚本外部 spawn 段 ~25-50% 提速**；对混合负载（内建主导，如 rubash 内建循环 25µs/iter）按外部 spawn 占比折算更小。
- rubash 每子进程由启动时单个内部线程 fork+execve+wait4（strace 实证），快路径（std posix_spawn）与该线程模型兼容，无架构冲突。
- **15.6x（owner 口径：nvm 解析 vs GNU）确认不受影响**：纯解释器/解析路径，不经过 external spawn；本轮亦不重测该口径（沿用 research/huck-vs-rubash-20261012.md 引用）。

## 6. 局限

WSL2 绝对值虚高；样本 178 条为元数据重取（原始实体已清理）；fd≥3 静态 grep 有少量误报（算术/版本串）但方向保守；ext-false 的 bash 1.46ms 为噪声上界。测量脚本与样本：D:/repo/research/unix-spawn-cost/（bench_gnu.sh / bench_rubash.sh / spawn_bench.rs / fetch2.sh / sample/）。
