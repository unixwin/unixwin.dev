# HIGHLIGHTS — unixwin 技术亮点事实包（2026-10-19）

> 总控审计产出。每条：一句话亮点 / 证据（文件路径、issue#、PR#）/ 建议门户表述。
> 纪律：每条事实带证据路径；无证据处标「未验证」。数字均为实测原样，门户不得四舍五入。

---

## 1. 全平台零 fork：三层执行模型

**亮点**：POSIX `fork()` 在 Win32 没有等价物，MSYS2/Cygwin 在 syscall 层伪造它（昂贵、脆弱、以怪癖闻名）；rubash 在三层复刻 fork 的*语义*而非其机制。

**证据**：`rubash/docs/architecture.md:25-33`（"Subshells without fork" 节，2026-10-10 自 README 迁入，commit 7be6a799，PR rubash#495）：
1. **进程内子壳**——`( list )` 与 `$( )` 从不产生进程：`ShellState::clone` 复制变量/别名/函数/trap/历史（fork 的内存面），子壳结束即弃。
2. **真句柄 fd 表 + POSIX dup 语义**——槽位持原生 Windows `HANDLE`，`DuplicateHandle` 共享同一内核文件对象（因此共享文件偏移），正是 POSIX "dup 共享 open file description"；落地上岸前有 POC 实证。`fork_table()` 逐句柄复制整表，同 fork 复制 fd 表不复制文件对象。
3. **真进程只在真进程边界**——外部命令与管道成员走 `CreateProcess` + `os_pipe`；后台作业与 coproc 各自持进程，作业控制基于 Job Objects，SIGCONT 经 `ResumeThread`。

**建议门户表述**：「subshell 与命令替换零进程创建成本，而脚本可观察的一切——退出码、fd 继承、共享偏移、信号处置——与 GNU Bash 行为一致」。

---

## 2. 路径方言全兼容：四大生态的路径写法，一个 shell 全收（杀手级）

**亮点**：Windows 原生（`D:\repo`、`D:/repo`）、MSYS/Git Bash 形（`/d/repo`、`/tmp`、`/usr/bin`）、WSL 形（`/mnt/d`）——**全部接受且真折叠，既有脚本零修改**；Cygwin 形（`/cygdrive/d`）在外部命令层全认（内建面分支补齐中，rubash#850）。而其他每家只原生认自己的方言，且**对照探针证明它们的"支持"常是假象**：Git Bash 的 `/mnt/d` 会静默落到安装根 `D:\Git\mnt\d`（cygpath 实证，假阳性地雷）；其 `/d` 支持依赖 bash argv 预转——PS 原生 argv 下 `git -C /d/...` 直接 cannot change。从任何生态迁到 niu，路径零迁移成本。

**证据**：
- 契约文档：`rubash/docs/windows-path-contract.md`（四层边界表：shell 内建语义层 / winuxcmd 参数层 / winuxcmd 子进程查找层 / 原生子进程 argv 层）+ `rubash/docs/host-contract.md`。
- 翻译完备性：PR rubash#600（issue #592）——翻译规则**表驱动**、与上下文/参数位/目标存在性无关；verbatim 豁免表成文（cygdrive/dev/开关形/附着值/env 值）；dirname/basename FS-blind 豁免；真实端到端 `worktree add` 落位正确。
- 三方言各有裁定与实现：cygdrive 折叠（WinuxCmd#1145）、`/mnt/X` native 解析（WinuxCmd#1172，PR #1227——含 `[4]` 分隔符负例的变异验证）、MSYS 单字母形 `/d/repo`（rubash `src/path.rs` external_argument_path）。
- 个性化配套：`$PWD` 恒 POSIX 形态（rubash#556，P0 #537 nvm 死循环根因修复的同一裁决）；niu-git 接受 POSIX-shaped `/d/...` 参数（wpm 索引条目明文）。
- 诚实在案：写侧命令的裸盘符根缺口正在收口（#1230 审计 15 命令、mkdir 真写格 #1233 最急）——边界契约让缺口可枚举可修，这正是契约文档存在的意义。
- **方言×层全量实测矩阵**：随包附 `PATH-MATRIX.md`（~100 条 PS 原生 argv 探针逐格实跑）。三发现：① `/d` 全家 niu 三层全认（stat 例外已开票 WinuxCmd#1244）；② `/mnt/d` **niu 真折叠（pwd -P=/d/repo）vs Git Bash 假阳性**（落安装根）——此维 niu > Git Bash >（WSL 真挂载但路径形不同）；③ `/cygdrive` 为 winuxcmd applet 面独占（#850 收口后全层独占）。缺口全部开票在案：WinuxCmd#1244、rubash#850、niu-git#18。

**建议门户表述**：「Windows、MSYS、Cygwin、WSL——四大生态的路径写法，一个 shell 全收。换 shell，不用改脚本。」


## 3. 无 MSYS：argv 永不改写——Git Bash 的原罪在这里不存在（杀手级）

**亮点**：Git Bash 的 MSYS 运行时会在 spawn 前**启发式改写**看起来像路径的参数——`/c` 变 `C:\`、不存在的 `/foo` 被展开成 Git 安装路径、`ssh user@host ls /tmp` 的 `/tmp` 在本机就被转换。每个 Git Bash 老用户都被迫学会 `MSYS_NO_PATHCONV` / `MSYS2_ARG_CONV_EXCL` 咒语——**这两个环境变量的存在本身就是官方承认问题的证据**。niu 没有 MSYS 运行时：argv 逐字节原样抵达，无咒语可念。速度只是表象，**确定性的 argv 语义**才是根子。

**证据**：
- verbatim 是成文核心不变量（三不变量之三「该 verbatim 的不转换」：commit 消息/分支名/引号操作数，#117/#149/#330/#552 家族）；`rubash/docs/windows-path-contract.md` + host-contract。
- 污染实锤案例（我们自己是受害者兼侦探）：Git Bash 直打 `ls.exe /mnt/c` rc=0 曾被误读为工具链支持 /mnt——#568 四路复测裁决：那是 **MSYS 运行时 spawn 前转换的污染**（测到的是 Git Bash 的转换层，不是工具链本体）；教训已写进 `windows-path-contract.md`。
- launcher 引号纪律：niu-git PR #6（MSVCRT 规则引号 + 消息形参守卫，test-launcher.py 差分 49/49）——引号规则按 Win32 文档行为对齐，零启发式。
- **七面对照实测**：随包附 `GITBASH-KILLER.md`（argv 改写 / winpty 咒语 / 每提示符 git 子进程 / DLL 与体积 / fork 模拟稳定性 / 启动链 / bash 版本语义——每面带 Git Bash 与 niu 双侧探针原始输出；无法本机复现的面单独标注，不冒充实测）。

**建议门户表述**：「在 Git Bash 里，你得学会 MSYS_NO_PATHCONV 这个词。在 niu 里这个词不存在——因为它不需要存在。参数进什么，命令就收什么。」


## 4. 内联 coreutils 名单（管道热路径不产生子进程）

**亮点**：高频文件类命令在引擎内联执行，`echo | cat` 这类管道一整个**零 fork**。

**证据**：`rubash/src/executor/external_file_builtins.rs:14-34`（`emulated` 表）：`pwd`（含 /bin/pwd、/usr/bin/pwd 形）、`printf`、`mkdir`、`touch`、`chmod`、`cp`、`rm`、`rmdir`、`cat`（含全路径形）、`sed`、`mkfifo`、`tty`；管道内联臂见 `rubash/src/executor/pipeline_exec.rs`（inline pipeline stage arm，:1541 注释锚）。`echo`/`test`/`[` 为原生 builtin（`rubash/docs/architecture.md` Subsystems 节）。

**建议门户表述**：「12 个高频文件命令内联执行 + 管道内联臂——`echo | cat` 全程不创建任何进程」。

---

## 5. GNU Bash 上游 83 套测试：83/83 通过、82 套逐字节一致

**亮点**：兼容性是**测出来的不是宣称的**——对 GNU Bash 自己的 83 套上游语料做 true-baseline 双向测量：83/83 通过，82 套逐字节一致，唯一残差（nameref 1 行）被逐字节证明是 **GNU Bash 自身的 coproc 回收竞态**。

**证据**：`rubash/README.md:17`（"83/83 suites pass on the 2026-10-12 full re-run: 82 suites byte-identical, and nameref's single residual line is proven to be GNU Bash's own coproc reap-timing race"）+ README 台账节 :81-108（PASS 83/83 100%、Byte-identical 82 suites (0 diff)、A/B 双 commit 逐套一致）+ `rubash/docs/nameref-suite-residual-gnu-race-20261012.md`（竞态归因的逐字节论证）+ PR rubash#506（82/83→83/83 台账落地）。语义判定一手依据 = 仓内 vendored GNU bash-5.3 源码（`rubash/third_party/bash`，b4608166），每个行为主张给 file:line 坐标；`rubash/docs/PROVENANCE.md` 成文参考纪律（行为坐标引用合法、GPL 代码零拷贝）。

**建议门户表述**：「83 套 GNU 上游语料 100% 通过、82 套输出逐字节相同——唯一差异经证明是 GNU 自己的竞态」。

---

## 6. 真·BASH 插件生态：未经修改的上游插件直接原生运行（旗舰）

**亮点**：oh-my-bash、bash-it、bash-completion、bash-preexec 这些真实世界的 BASH 生态资产，**源码一行不改**就在 niu 里原生运行——没有 MSYS、没有 Cygwin、没有 WSL。Git Bash 能跑它们是因为捆绑了真 bash + 整个 POSIX 模拟层；PowerShell/Nushell/fish 等原生 shell 完全无法执行 bash 语法。niu 是从零写的 Rust 引擎直接执行插件源码——这一格没有第二家。

**证据**：
- 目录即官方上游（非 fork 非移植）：`niubash/crates/niubash-runtime/src/plugins/descriptors.rs:143/212/260`（origin = ohmybash/oh-my-bash.git、Bash-it/bash-it.git、scop/bash-completion.git）+ `distros.rs:951-952`。
- 端到端门禁：niubash journey P6-S1 "trust + activate bash-completion"（`niubash/docs/journey-steps.json:86`，expected_today=green；断言=zero syntax errors + `_init_completion` loaded）；bash-completion **3796 行完整 source rc=0** 曾是发布阻塞，解锁修复 = rubash PR #603（merged 2026-10-13：dollar-brace 体扫描首未引号闭括号收口 + ANSI-C 转义保真两修）。
- 真资产逐字节一致：bash-preexec 最小形与 wezterm 全资产 transcript 与 WSL GNU 5.3.0 逐字节一致（rubash PR #807，issue #797）。
- 生态即语料（兼容性是被测出来的）：eco-harvest 收割 **2686 仓 / 9701 资产**（CI 每夜巡检、失败自动开票）；**6336 条**真实资产判定原文入仓（`niubash/scripts/harvest/snapshots/wt92-local-20261005/`，4.9MB）+ 747 条重审计台账（`snapshots/reaudit-20261010/`，niubash#263）；官方资产逼出的修复群——#452 语法误拒 54 形（extglob @(/for hash/函数定义）、#451 HANG 族、huck 语料 #507-#551、gradle 补全 awk 管道依赖（wpm 预装 gawk 的立项理由，niubash#189）。
- 生态判定方法论：快照判定不稳定实锤（275 资产互相矛盾，niubash#263）→ CI 可复现重审计为新权威。

**建议门户表述**：「上游 BASH 插件，一行不改，直接跑。没有 MSYS，没有 WSL——2686 个真实生态仓的巡检语料，让兼容性成为被测量的事实，而不是口号」。


## 7. 性能：可复现的实测数字

每条均为真机实测，证据含方法与 commit：

| 亮点 | 数字 | 证据 |
|---|---|---|
| 一次性执行（`niu -c true`，脚本/CI 场景冷启动） | 105.6ms → **19.8ms** | niubash PR #267-#272（xgr fork 六连，作者 xianguanrong 署名保留；one-shot 快路径在其中） |
| 多行粘贴自动执行次数 | 186 次 → **0**；257 行载荷 300s 超时 → **4.6s** | niubash PR #252/#288（PasteChunkEditMode，50ms burst 窗口）；基准 `niubash/scripts/perf/paste_multiline_bench.py` |
| nvm.sh 解析（重词法） | 720x 差距 → **8x**（opener-state checkpoint，重词法字节 -40%） | rubash PR #486（issue #281） |
| 关联数组元素写 K=5000 | O(n²)→O(1) 追加，单次写 **快 45 倍**（对 GNU 差距 445x→9.9x） | rubash PR #650（issue #618） |
| 索引数组覆盖写 K=5000 | **快 177 倍**（674x→3.8x）；顺带修 O(n²) tokenizer（10001 段 563ms→17.8ms） | rubash PR #652（issue #616） |
| 单次 spawn | rubash 1.183ms vs GNU 1.121ms——**与 GNU 持平**（Win32 CreateProcess 地板） | `research/unix-spawn-cost-20261012.md`（若门户需此文件随 BENCH 附上） |
| git 提示符段 | 读 `.git/HEAD` 文件（微秒级）替代 Git Bash 的每提示符 git 子进程（毫秒级），rr p50 2.5ms | niubash#292（GitBash 兼容默认主题立项）+ rubash#604 消融实测（"自带 Git Bash compatible 默认 rr p50 2.5ms 不慢"）；实现 PR 号未验证 |
| niu-git git 启动 | **~14ms** vs Git Bash 75-100ms | 组织仓描述（github.com/unixwin/niu-git）+ niu-git PR #6 launcher 修复 |
| 后台等待（sleep & wait） | 2.47x 退化定位为 fork/exec 集，直 spawn 修复（四面等价三轮回炉） | rubash#809 → PR #834/#835 |
| WinuxCmd 冷启动 | 3.79MB 携带 176 命令 / 1,924 选项，**~19ms 冷启**；PGO：sort **−18%**、nl **−17%** | WinuxCmd/README.md:32,:74（PGO 构建口径；CMakeLists PGO 配置） |

- 性能回归门：CI 夜间 per-asset timing trend job（主题渲染预算 120ms、5x 超预算硬失败；asset-timing hard/soft 双门，PR niubash#337）。

**建议门户表述**：每条独立成卡，注明「实测、可复现、基准随包附上；夜间性能门防回潮」。

---

## 8. 输入层：Windows 粘贴与键盘的深水区

**亮点**：ConPTY/内核控制台队列的输入语义被逆向到字节级——这是 MSYS2/Cygwin/各大 shell 都没有做透的面。

**证据**：
- niubash#341（真机 WT 粘贴丢字符，四轮悬案）：破案 = ConPTY KEY_EVENT 记录流 vs 字节流两条物理路径 + pushback 不变式（"pushback 永不持有裸 CR"）；修复 PR rubash#411。
- PasteChunkEditMode（上表 #252/#288）：50ms burst 阈值 = 低于人类打字下限 66ms、高于重绘正反馈阈值。
- niubash#420 wedge（脚本楔死在 PS2）：破案 = chunk-open CR 伙伴折叠把一次写入里的两次 typeahead 提交误认为 WT 粘贴空行；修复 = 裸 CR 不作粘贴证据 + `unread` 面（WriteConsoleInputW 重注入，即 niubash#417 的原语）；PR niubash#426。
- 活动控制台 `read` 三面（-t 门饿死 / conhost 预煮劈半行 / ICRNL）：rubash PR #816（批量 readiness 探测 + one-char deadline + ICRNL，GNU read.def:570-590 ttfd_onechar 对齐）。

**建议门户表述**：「Windows 输入管线的字节级兼容工程：粘贴、typeahead、控制台 read 与 GNU 行为对齐，每项带双向差分证据」。

---

## 9. 跨平台：一个引擎，五条 CI 腿

**亮点**：原生 Windows 为主场，Linux/macOS/Android/OpenHarmony 全部进 CI 门禁——不是"理论上能编译"。

**证据**：rubash CI（`.github/workflows/`）：x86_64/aarch64 Windows、linux-gnu、linux-musl、macOS、aarch64-linux-android、armv7-linux-androideabi、aarch64-unknown-linux-gnu（OH check）；真 Unix stty（PR #732，非 Windows 空桩→isatty/termios/TIOCGWINSZ 实现）、真 uid/euid（PR #698，getuid() 对齐 GNU variables.c:984）；niubash CI 的 cross-target-check ×4 + cross-target-smoke。`rubash/docs/cross-platform-gap-ledger.md` 为缺口台账。

**建议门户表述**：「Native Windows、Linux、macOS 构建；Android 交叉编译检查进 CI；OpenHarmony 检查腿——无 MSYS、无 WSL、无 POSIX 模拟层」。

---

## 10. 安全、边界与沙箱

**亮点**：Windows 路径翻译是表驱动完备的、有契约文档的；不可信代码零宿主暴露。

**证据**：
- 路径翻译完备性：PR rubash#600（#592）——翻译规则表驱动、verbatim 豁免表成文（cygdrive/dev/开关形/附着值/env 值）；契约文档 `rubash/docs/windows-path-contract.md`（四层边界表）+ `rubash/docs/host-contract.md`。
- 核心设计三不变量（native 核心 / POSIX 形态原生可用 / 该 verbatim 的不转换）：2026-10-12 owner 质询后 codify，边界契约审计立档。
- 生态采集安全整改：eco-test.py 曾只有 HOME env 假沙箱（C 盘清空事故元凶）→ 现为 CI `eco-harvest-ci.yml`：**不可信资产只在 ephemeral windows runner 执行**，harvest 与 test 分离，失败自动开票。
- 6336 条真实生态资产判定原文入仓（`niubash/scripts/harvest/snapshots/wt92-local-20261005/`），747 记录重审计台账（niubash#263）。
- rbash 启动语义对齐 GNU（PR niubash#413：argv0 面 + `-r` 旗标同为 finish_startup 后激活）。
- journey 端到端门禁：真 ConPTY + marker 载荷断言 + 楔死界校准（PR #344）。
- **零遥测**：全仓 grep `telemetry|analytics|sentry|posthog` 零命中（2026-10-19 实测）——shell 不给任何服务器打电话，闭环靠 issue。
- 插件信任的校验层：checksum tier（受损树 → `niu plugin source verify` 报告 → `niu plugin restore` 从 pin 重建；journey P6-S4 钉住"静默或文档化的修复行，永非错误风暴"）。

**建议门户表述**：「路径翻译规则表驱动 + 契约文档；不可信脚本零宿主暴露；6336 个真实生态资产的判定原文可回放」。

---

## 11. 供应链与发布工程（本周刚加固）

**亮点**：发行资产可溯源到 commit——2026-10-19 起发布链对引擎源做 pin+fail-hard，脏构建在 `--version` 里自曝。

**证据**：
- rubash#827 审计（2026-10-19）：v1.4.0 发行资产被实证为「从错误源码状态构建」（release workflow 浮动克隆 master 无 pin）；行为指纹法（拿发行资产跑 #754 复现）定案。
- 加固 PR niubash#424（已合并，merge commit cee5ad8b）：`scripts/release/rubash-pin.json` + release.yml 8 个消费 job 全部 pinned fetch 失配 fail-hard + Cargo.lock path 形态 + `--locked` 锁死静默回落（CR 实验证明 patch 缺失时 exit 101）+ build.rs 脏树摘要（`<rev>-dirty-<sha256前8>`，干净树字节级不变）+ `verify-rubash-pin.py` 篡改自测进 CI + 每周 pin-freshness 干跑。
- tag 防护提案：niubash#425（本周期 release tag 被重推 ≥6 次的教训）。
- WinuxCmd v1.1.15：发布档首次可验证携带 `winuxcmd-shim.exe`（v1.1.14 实测 0 个，#1207/#1225），索引脚本拒绝为缺文件的档写条目；niubash PR #427 把发布 pin 升到 v1.1.15（有意跳过 1.1.14）。
- 安装器：Inno Setup 双架构 + `--check-links` inode 等价门（PR #414）；winget 原地升级 PR #444854 验证中。
- 原生工具链到底：niu-git = **MSVC + CMake + schannel**——不捆 OpenSSL（TLS 走 Windows 证书库）、不捆 shell/perl（bash 语义由 niu 自己的 sh 承担）；rubash 三 crate 已上架 crates.io（1.4.0），引擎即依赖可用（稳定嵌入 API 为 1.5.0 目标，设计稿已合并 PR rubash#814）。

**建议门户表述**：「发行资产 commit 可溯源：pin+fail-hard+脏构建自曝——带病二进制到不了用户手里」。

---

## 12. AI 原生：为 AI agent 而建的工程面

**亮点**：这不是营销词——脚本化的确定性、可审计的执行面、AI 友好的调试与剖析。

**证据**：
- 一次性执行 19.8ms（上表）：AI agent 高频 `-c` 调用的地板。
- 为 agent 而设的旗标面：`niu --encoded-command <base64>`（**免引号通道**：RFC 4648 载荷走与 `-c` 完全相同的一次性路径与 `BASH_EXECUTION_STRING` 契约；可选 `v1:` 前缀防御性剥离——注释明写"MSYS path conversion 会改写 `/` 开头的参数"，连自家旗标都防着 Git Bash 父进程的转换层，PR #271）；`niu --cwd-state <file>`（一次性调用链的**目录记忆**：启动前恢复、退出后写回，链式 `niu -c` 表现得像同一个 shell；不加旗标字节级零变化，PR #272；tests/issue390_encoded_command_flags.rs）。
- debugger M0 设计（`rubash/docs/design/debugger-m0.md`，rubash#497 已裁决：`--debugger` 旗标 + DAP-first + 行级/函数入口停点；11 个停点 seam 全部 file:line 锚定在既有 DEBUG-trap 分发点；bashdb GPL 不可随发故自建 DAP）。
- profiler（#815，PR rubash#829 已合并）：脚本级热点分布（AI 多数要热点分布而非 stepping）。
- 1.5.0 蓝图（`rubash/docs/design/1.5.0-workspace-and-engine-api.md`，PR rubash#814 已合并）：四层 workspace 拆分（core/driver/interactive/facade）+ 稳定嵌入 API + 846 处 env-IPC → typed bridges。
- 生态收割：eco-harvest 全网 2686 仓/9701 资产巡检（CI 每夜），发现的真实缺陷回流上游修复（如 rubash#505）。

**建议门户表述**：「引擎即库（1.5.0 嵌入 API 蓝图已合）、脚本级 profiler、DAP 调试器设计定稿——AI agent 的每一次调用都可审计」。

---

## 13. oh-my-niu 与 wpm 生态

**证据**：oh-my-niu bundle 2.0（28 主题 + plugins/packs/aliases/completions，catalog 三源不绑 oh-my-niu 而指官方上游 ohmybash/bash-it/bash-completion）；GitBash 兼容默认主题（零 git 子进程，视觉对齐但明确不做 MINGW64 身份段）；wpm 包管理器随 winuxcmd 内建（`winuxcmd wpm`），wpm-source 索引带 sha256/size/urls 三元组；wpm 缓存键 `<pkg>-<version>-<sha8>` 双校验（WinuxCmd#1154/#1157）；wpm-gui 已评估归档（CLI 契约漂移，wpm-gui#1）。

---

## 14. 证据文化（工程方法本身就是亮点）

- 语义判定一手依据 = vendored GNU bash-5.3 源码（`rubash/third_party/bash`），行为主张必须给 file:line；WSL GNU 5.3.0 只做行为验证；GPL 代码零拷贝红线（`rubash/docs/PROVENANCE.md`）。
- 双向差分方法论：同机同环境跑纯基线失败集，双向 comm 为空才放行（修复代理军规）。
- 收件链纪律：每单合并后 master CI 复验（niubash#272 事故后成文）；GNU goldens 单列绿灯条件（rubash#553 事故后）。
- 作者/评审分离的 CR 舰队：单日 7 单合并、每单带独立 CR 轮与逐验证点报告。
- WinuxCmd 每个 PR 自动对 GNU upstream 跑差分（CI "GNU master differential"：oracle + compare 双 job，178 例语料，93% 通过率+13 例 tracked platform diffs 实名在册）。
- 外部贡献欢迎且署名保留：rubash#447（社区 bbvdf 的 cat 流式修复，含 745→82665 基线对照）；xgr fork 六连 PR #267-#272（作者 xianguanrong 署名保留）。

---

## 附：待门户复核的边缘项（宁多勿漏）

- PGO：**未验证**（未在仓内找到 PGO 配置证据，门户暂勿写）。
- 商店（MSIX）：材料在 `niubash/docs/store/`，构建需编译期禁 self-update——规划中，**未发布**。
- microaddr/其他：无。
