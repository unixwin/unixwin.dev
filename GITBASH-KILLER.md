# GITBASH-KILLER — 为什么 niu 杀死 Git Bash（速度只是其中一面）

> 对照审计产出（2026-10-19）。每面 = 「Git Bash 的痛（探针 + 原始输出）→ niu 的答案（探针 + 原始输出）→ 证据锚」。
> 纪律：只读对照，未改任何仓库；数字均为实测原样，不得四舍五入；无法本机复现的面单独列「社区已知、本机未复现」节，绝不冒充实测。
> 探针环境：Windows 10.0.19045 x64 单机同负载。Git Bash = `D:/Git`（GNU bash 5.2.37(1)-release, x86_64-pc-msys；package-versions.txt: `bash 5.2.037-1`）。niu = Niubash 1.4.0 装机（`C:/Users/cmx/AppData/Local/Programs/Niubash/niu.exe`，rubash git e785c3c8f610，winuxcmd WinuxCmd 1.1.14）。
> **#1230 铁律**：niu 侧探针一律经 PowerShell/cmd 原生 argv 发起，不经任何 POSIX shell 转手。Git Bash 侧探针均在 `D:/Git/bin/bash.exe` 内执行。临时产物（%TEMP%/aud-f1-blame、aud-bench-startup.ps1）已清理。

---

## 面 1：MSYS argv 转换之恶（核心面）—— 你打的字和进程收到的字不是同一串

### Git Bash 的痛（全部本机复现）

转化规则：参数以 `/` 开头时，msys-2.0.dll 在 spawn 原生 Windows 子进程前**猜意图并改写 argv**。注意：bash 内建（`echo` 等）不跨进程边界，所以内建 `echo /notapath` 原样输出——**痛苦只在真正的原生子进程上兑现**，而这正是 docker/ssh/java/npm scripts 所在的地方。

```text
$ D:/Git/bin/bash.exe -c 'echo /usr/bin; echo /notapath'   # 内建，无转化
/usr/bin
/notapath

$ D:/Git/bin/bash.exe -c 'cmd //c echo /c'      # 双斜杠咒语（旗标形）
C:/                                             # 旗标救了，数据参数 /c 仍被改成 C:/

$ D:/Git/bin/bash.exe -c 'cmd /c echo /c'       # 自然写法
Microsoft Windows [Version 10.0.19045.6466]     # cmd 收不到 /c，直接进交互横幅
(c) Microsoft Corporation。保留所有权利。

$ D:/Git/bin/bash.exe -c 'cmd //c echo /notapath'
D:/Git/notapath                                 # 不存在的路径展开成 Git 安装根

$ D:/Git/bin/bash.exe -c 'cmd //c echo /usr/bin'
D:/Git/usr/bin                                  # 存在的 POSIX 目录同样被改写

$ D:/Git/bin/bash.exe -c 'cmd //c dir /b /ad "D:/Git/bin"'
Parameter format not correct - "D:".            # dir 的旗标被当路径，命令报废

$ D:/Git/bin/bash.exe -c 'cmd //c echo java -Dx=/y'
java -Dx=Y:/                                    # JVM 系统属性值变成盘符 Y:/

$ D:/Git/bin/bash.exe -c 'cmd //c echo -Dconfig=/etc/app.conf'
-Dconfig=D:/Git/etc/app.conf                    # 等号后的路径被接上 Git 安装根
```

厂商文档点名案例（`-L/regex/`、`--upload-pack=`）本机原样复现：

```text
$ cmd //c echo -L/needle/                        →  -LD:/Git/needle/
$ cmd //c echo --upload-pack=/opt/git/bin/git-upload-pack
                                                 →  --upload-pack=D:/Git/opt/git/bin/git-upload-pack

$ git blame -L/needle/ f.txt                     # 自然写法
usage: git blame [<options>] [<rev-opts>] [<rev>] [--] <file>     rc=129

$ MSYS_NO_PATHCONV=1 git blame -L/needle/ f.txt  # 厂商给的解咒姿势
^ef7d726 (t 2026-10-19 11:37:00 +0800 2) needle here              rc=0
```

厂商自己的 ReleaseNotes（随 `D:/Git/ReleaseNotes.html` 装机自带）承认这一切：

> "If you specify command-line options starting with a slash, POSIX-to-Windows path conversion will kick in converting e.g. \"/usr/bin/bash.exe\" to \"C:\\Program Files\\Git\\usr\\bin\\bash.exe\". When that is not desired -- e.g. \"--upload-pack=/opt/git/bin/git-upload-pack\" or \"-L/regex/\" -- you need to set the environment variable MSYS_NO_PATHCONV temporarily…"

> "The POSIX-to-Windows path mangling can now be turned off by setting the MSYS_NO_PATHCONV environment variable."（v2.4.4 注）

**两个逃逸阀（`MSYS_NO_PATHCONV` / `MSYS2_ARG_CONV_EXCL`）的存在本身就是厂商对问题的书面承认**；且逃逸阀与双斜杠咒语互斥（开逃逸阀后 `//c` 不再被还原成 `/c`，cmd 又进交互横幅）——用户必须按命令逐个选对咒语。

### niu 的答案（PS/cmd 原生 argv，#1230 铁律）

```text
PS> niu -c 'echo /usr/bin'                      → /usr/bin
PS> niu -c 'echo /notapath'                     → /notapath
PS> niu -c 'cmd /c echo /c'                     → /c          # 自然写法，无需咒语
PS> niu -c 'cmd /c echo /notapath'              → /notapath
PS> niu -c 'cmd /c echo java -Dx=/y'            → java -Dx=/y
PS> niu -c 'cmd /c echo -Dconfig=/etc/app.conf' → -Dconfig=/etc/app.conf

# 逐字节相等断言（-ceq，区分大小写）：三个全 True
PS> (niu -c 'echo /notapath') -join '' -ceq '/notapath'                 → True
PS> (niu -c 'cmd /c echo /c') -join '' -ceq '/c'                        → True
PS> (niu -c 'cmd /c echo -Dconfig=/etc/app.conf') -join '' -ceq '-Dconfig=/etc/app.conf' → True
```

无 `MSYS_NO_PATHCONV`、无 `MSYS2_ARG_CONV_EXCL`、无 `//` 咒语——niu 源码里不存在这类逃逸阀（grep `MSYS_NO_PATHCONV|MSYS2_ARG_CONV_EXCL` 于 `D:/repo/niubash/src`、`crates/`：零命中；仅 docs 两处提及作对照）。

### 证据锚

- `D:/Git/ReleaseNotes.html`（path conversion 段、v2.4.4 MSYS_NO_PATHCONV 注——装机自带）
- `D:/Git/etc/profile.d/git-prompt.sh`、`D:/Git/usr/bin/msys-2.0.dll`（20,344,016 字节）
- niu 契约：`D:/repo/niubash/docs/src/windows-path-contract.md`——「A child process either resolves the shell namespace itself or receives native paths — never both, and never a guess about the child's capabilities」；自带 applet 原样收 `/`、`/usr/bin`、`/etc`；「exactly one path-semantics owner and no host-side AST rewrite」

---

## 面 2：winpty 咒语 —— 交互式 TUI 先拜 winpty 再谈运行

### Git Bash 的痛

minTTY 不是 Windows 控制台，原生控制台程序在它底下交互会挂；Git Bash 的答案是随包发一整套 winpty 并给常用解释器预设别名：

```text
$ ls -la D:/Git/usr/bin/winpty*     # 装机自带整套 winpty
185344  winpty.exe          （winpty version 0.4.3）
        winpty.dll
        winpty-agent.exe    （356K）
        winpty-debugserver.exe
```

`D:/Git/etc/profile.d/aliases.sh` 第 9–18 行（vendor 原文）：

> "# The following programs are known to require a Win32 Console for interactive usage, therefore let's launch them through winpty when run inside `mintty`."
> `for name in node ipython php php5 psql python2.7 winget; do … alias $name="winpty $name.exe" …`

`D:/Git/ReleaseNotes.html`（vendor 原文）：

> "Some console programs, most notably non-MSYS2 Python, PHP, Node and OpenSSL, interact correctly with MinTTY only when called through winpty (e.g. the Python console needs to be started as **winpty python** instead of just python)."

### niu 的答案

niu 是原生控制台程序，直接活在真实控制台/ConPTY/Windows Terminal 里，没有 winpty 这个概念：

```text
PS> niu -c 'winpty --version'
niu: line 1: winpty: command not found     # 命令集里根本没有它，也不需要它
```

交互面有专门的 ConPTY 回归测试架：`D:/repo/niubash/tests/interactive/driver.rs`（基于 portable-pty 0.9，在 ConPTY 下以确定性环境 spawn niu 驱动整段交互回放）与 `D:/repo/niubash/tests/ctrl_c_conpty_check.py`（ctypes 裸调 CreatePseudoConsole 驱动 niu.exe 验证 Ctrl+C trapint hook）。rubash 侧对「输入来自 winpty/ConPTY 桥」的场景是**兼容读取**（`D:/repo/rubash/src/console_readline.rs:174`、`script_driver.rs:3336`，rubash#434），而不是依赖包装器。

### 证据锚

- `D:/Git/usr/bin/winpty.exe|winpty.dll|winpty-agent.exe|winpty-debugserver.exe`（存在即证据）
- `D:/Git/etc/profile.d/aliases.sh:9-18`；`D:/Git/ReleaseNotes.html`（winpty python 段）
- `D:/repo/niubash/tests/interactive/driver.rs`、`D:/repo/niubash/tests/ctrl_c_conpty_check.py`、`D:/repo/rubash/src/console_readline.rs:174`

---

## 面 3：每提示符 git 子进程 —— 每敲一次回车，先给 git 交几毫秒税

### Git Bash 的痛

默认提示符内嵌 `__git_ps1`（`D:/Git/etc/profile.d/git-prompt.sh:31`：`PS1="$PS1"'\`__git_ps1\`'`），实际 spawn 点在上游补全脚本 `D:/Git/mingw64/share/git/completion/git-prompt.sh`（672 行）：

- L468：`git rev-parse --git-dir --is-inside-git-dir --is-bare-repository --is-inside-work-tree --show-ref-format --short HEAD` —— **每次渲染无条件 spawn**
- L540/L559：`git symbolic-ref HEAD`
- L568–576：`git describe` 五种变体（`GIT_PS1_SHOWTAGPRECISE` 等开启时）
- L617–618：`git diff --quiet` + `git diff --cached --quiet`（dirty 标记）
- L623：`git rev-parse --verify refs/stash`（stash 标记）
- L628–630：`git config --bool bash.showUntrackedFiles` + `git ls-files --others`（untracked 标记）
- L287：`git rev-parse`（upstream 名）

实测（真仓库 `D:/repo/niubash`，min-of-20，date +%s%N 计时）：

```text
__git_ps1 默认（仅分支名）：        min 113 ms / 次提示符
__git_ps1（dirty+stash+untracked）：min 362 ms / 次提示符
```

### niu 的答案

提示符 git 段**至多一次**受限 spawn，仓库外零 spawn：

- `D:/repo/niubash/crates/niubash-runtime/src/git_prompt.rs` `find_worktree()`——祖先目录找 `.git` 标记，注释原文：「Cheaper than asking git, and outside a repository it is the entire cost of the segment: **nothing is spawned**」
- `read_status()`——单次 `git status --porcelain=v2 --branch`（`--no-optional-locks`、`core.fsmonitor=false`、`GIT_OPTIONAL_LOCKS=0`；stdout 走 scratch 文件不吃管道调度量子；`WaitForSingleObject` 精确等待 + 超时上限；封顶读取，分支头在流前部）
- 段引擎：`prompt_segments.rs:24` `pub enum SegmentId`（`SegmentId::Vcs`，niubash#331）

实测（同仓库，min-of-20，PS Stopwatch）：

```text
niu-git status --porcelain=v2 --branch（=niu 提示符段的主体成本）：min 29 ms
参照：Git Bash 的 git status 同命令：                              min 40 ms
参照：niu-git --version：min 11 ms；Git Bash git --version：      min 26 ms
```

即：默认提示符 113 ms → 29 ms，全开标记 362 ms → 29 ms（一次调用同时给分支+dirty）。

### 证据锚

- `D:/Git/etc/profile.d/git-prompt.sh:31`；`D:/Git/mingw64/share/git/completion/git-prompt.sh:287,468,540,559,568-576,617-618,623,628-630`
- `D:/repo/niubash/crates/niubash-runtime/src/git_prompt.rs`（find_worktree / read_status / parse_status）、`prompt_segments.rs:24`（niubash#331）

---

## 面 4：DLL 与体积 —— 一个 19.4 MB 的运行时 DLL 对一个 11.5 MB 的完整 shell

### Git Bash 的痛

```text
du -sh D:/Git           → 440M   （usr 203M + mingw64 228M + 根）
du -sh D:/Git/usr/bin   → 378 个条目
msys-2.0.dll            → 20,344,016 字节（≈19.4 MB），D:/Git/usr/bin/ 唯一一份
D:/Git/mingw64/libexec  → 93M（git-core 122 个条目）
```

每个子进程都背 msys-2.0.dll 的初始化账；整个 POSIX 世界（fork 模拟、路径转换、pty 转译）都在这一颗 DLL 里——面 1/2/5 的全部病灶与它是同一物。

### niu 的答案

```text
niu.exe                          → 12,083,200 字节（11.5 MB，含 rubash 引擎 + REPL + 提示符 + 插件栈）
winuxcmd.exe                     → 4,136,448 字节（3.94 MB），硬链 179 份
                                   ——ls/cat/grep/find… 每个 applet 名都是同一物理文件的硬链接
winuxcmd/bin/bash.exe|sh.exe     → 243,200 字节启动器
niu-git git.exe                  → 5,254,656 字节（MSVC 构建的真 git，6 硬链；无 MSYS 运行时、无 perl）
```

组织仓口径：`D:/repo/WinuxCmd/README.md:7`「**Real Unix commands. Real Windows paths. One ~3 MB executable.**」、`:91`「Ship WinuxCmd alone in a 3 MB exe」——装机位实测 3.94 MB，同量级。无 DLL：三层全部静态进 exe（见面 5）。

诚实备注：本机 `Niubash/` 全树 1.3 GB，其中 `winuxcmd/opt/` 956M 是用户经 WPM 另装的载荷（python 653M、node 138M、nvim 40M 等）+ `usr/bin` 里另装的 k6 68M、gh 40M——**shell 本体 ≈ 16 MB**（niu.exe + winuxcmd + niu-git），opt 属可选安装内容，与 Git Bash 的 440M 底盘不可比。

### 证据锚

- `D:/Git/usr/bin/msys-2.0.dll`；`du -sh` 实测数（上文）
- `D:/repo/WinuxCmd/README.md:7,91,121`；装机位 `stat`/`du` 实测数（上文）

---

## 面 5：fork 模拟稳定性 —— 「address space needed … is already occupied」之病

### 社区已知、本机未复现

**本机审计期间未复现 fork 失败**；以下为厂商与社区书面记录，仅作引证，不冒充实测：

- 装机自带 `D:/Git/ReleaseNotes.html` 两处（vendor 原文）：
  - 「Git for Windows' fork of the MSYS2 runtime was rebased to a preview of the Cygwin runtime version 2.8.0 … **to fix** `fork: child <n> - forked process <pid> died unexpectedly, retry 0, exit code 0xC0000142, errno 11` problems.」
  - 「This should solve some **\"fork: resource unavailable\"** issues. All DLLs are **rebased** to avoid problems with \"fork\" on Vista.」（2008 年注——靠 rebase DLL 防 fork 失败是十几年没断过的功课）
- 官方页 [gitforwindows.org/problems-specific-to-32-bit.html](https://gitforwindows.org/problems-specific-to-32-bit.html)：`1 [main] perl 297 child_info_fork::abort: address space needed by 'Cwd.dll' (0x1D0000) is already occupied.`
- [MSYS2 News](https://www.msys2.org/news)：挂死时惯用抢救口诀 `taskkill /f /fi "MODULES eq msys-2.0.dll"`。
- [git-for-windows/build-extra ReleaseNotes.md](https://github.com/git-for-windows/build-extra/blob/master/ReleaseNotes.md)：链到 msys-2.0.dll 的可执行文件与强制 ASLR（Mandatory ASLR）不兼容。
- 社区侧成因归纳（[Stack Overflow #11107155](https://stackoverflow.com/questions/11107155/how-to-fix-address-space-is-already-occupied-error-on-fetch-commit)、[mintty/wsltty#6](https://github.com/mintty/wsltty/issues/6)）：ASLR/BLODA 占住 msys-2.0.dll fork 需要的地址空间 → fork 失败。

### niu 的答案：没有 fork 可失败

`D:/repo/rubash/docs/architecture.md:25-33`「Subshells without fork」（PR rubash#495）——复刻 fork 的*语义*而非机制，三层：

1. **进程内子壳**：`( list )`、`$( )` 零进程创建，`ShellState::clone` 复制变量/别名/函数/trap/历史；
2. **真句柄 fd 表 + POSIX dup 语义**：`DuplicateHandle` 共享内核文件对象（同 fork 共享 open file description），`fork_table()` 逐句柄复制整表；
3. **真进程只在真进程边界**：外部命令与管道走 `CreateProcess` + `os_pipe`，作业控制基于 Job Objects，SIGCONT 经 `ResumeThread`。

`D:/repo/niubash/docs/src/architecture.md`：「Niubash is **not** an MSYS2, Git Bash, Cygwin, or WSL-style isolated environment」——三层（Niubash host / rubash lib / winuxcmd.exe）皆 Rust/C++ 原生，无 msys-2.0.dll，无 fork 模拟层，因此「地址空间被占」这一类病没有宿主。

### 证据锚

- `D:/Git/ReleaseNotes.html`（fork 两处，装机自带）
- `D:/repo/rubash/docs/architecture.md:25-33`（PR rubash#495）；`D:/repo/niubash/docs/src/architecture.md`（三层模型 / 非 MSYS 声明）

---

## 面 6：启动链 —— `bash -c true` vs `niu -c true`

### 探针（同机同负载，PowerShell 直接调用 CreateProcess，预热 3 次后 min-of-20 + 中位数；两侧同为非交互 `-c`，均不 source rc，对照公平）

```text
D:\Git\bin\bash.exe -c true：      min 71.0 ms / median 86.7 ms（n=20）
niu.exe              -c true：     min 26.3 ms / median 37.6 ms（n=20）
D:\Git\bin\bash.exe -c "exit 0"：  min 62.2 ms / median 68.5 ms（n=20）
niu.exe             -c "exit 0"：  min 27.9 ms / median 37.9 ms（n=20）
```

**启动链 niu ≈ 2.3–2.7×（min 口径 26.3 vs 71.0 ms）。** 交叉印证：主会话 `portal-pack/BENCH/startup.tsv`（gnu_msys 60–93 ms vs rubash 27–48 ms，各 5 次）同量级同方向。附带：`git --version` 冷启 niu-git 11 ms vs Git Bash git 26 ms（niubash README 宣称口径 ~14 ms vs 45–103 ms，方向一致）。

复现要点：预热后 `[Diagnostics.Stopwatch]` 直接 `& exe -c 'true'`（勿用 `Start-Process -RedirectStandardOutput`，其固定 ~1 s 开销会淹没全部差异）。

### 证据锚

- 本节实测数字；`portal-pack/BENCH/startup.tsv`（只读参照）

---

## 面 7：bash 版本与语义 —— 5.2 msys 尾巴 vs GNU 5.3.0 台账

### 对照

```text
Git Bash：GNU bash, version 5.2.37(1)-release (x86_64-pc-msys)   （package-versions.txt: bash 5.2.037-1）
niu 装机 bash 启动器：GNU bash, version 5.3.0(1)-release (x86_64-pc-msys)
niu 自报：Niubash 1.4.0 — bash-compatible shell for Windows
          rubash git e785c3c8f610 / winuxcmd WinuxCmd 1.1.14
```

Git Bash 锁在 GNU Bash 5.2.37（msys 构建补丁集），版本由 Git for Windows 发版节奏决定。niu 侧 rubash 以 **GNU Bash 5.3.0 为兼容基线**，且是台账制不是口号制：

> `D:/repo/rubash/README.md:17`：「compatibility is verified against GNU Bash's own 83-suite upstream test corpus — **83/83 suites pass** on the 2026-10-12 full re-run: 82 suites byte-identical, and nameref's single residual line is proven to be GNU Bash's own coproc reap-timing race, not a rubash divergence」

台账原文（`rubash/README.md:81-87`）：「GNU Bash 5.3.0 test suite — 83 files, true-baseline measurement（ledger: 2026-10-12 full re-run on master 764b9dde …）PASS: 83/83 suites 100%」； niubash 侧路由：`docs/src/rubash-bash-compat-matrix.md`（聚焦 fixtures + host contract + 上游门三层证据）。

### 证据锚

- `D:/Git/etc/package-versions.txt`；两枚 `bash --version` 实测输出
- `D:/repo/rubash/README.md:17,81-87`；`D:/repo/niubash/docs/src/rubash-bash-compat-matrix.md`

---

## 尾注（诚实边界）

- 面 2 的「winpty 咒语生效现场」未做活体 TUI 演示（探针均在非交互管道下运行，复现 minTTY 挂起需真 pty 会话）；该面证据为**装机产物存在性 + vendor 文档原文 + niu 侧 ConPTY 测试架**三类静态实证，未冒充交互实测。
- 面 6 计时在 PowerShell 5.1 直接调用口径下取得；换计时器/预热策略数字会漂，但两侧差值方向与本机 BENCH 台账一致。
- 本文件只读对照产出，未改 `winuxcmd-wt-1231/1233` 与 portal-pack 内其他文件；临时产物已清理（%TEMP%/aud-f1-blame、aud-bench-startup.ps1）。

---

## 复现性划分（总表）

| 面 | 结论 | 本机复现? |
|---|---|---|
| 1 argv 转换 | `//` 咒语/安装根展开/旗标毁伤/厂商两案例全中；niu 逐字节原样 | ✅ 全复现（含 `-LD:/Git/needle/`、blame rc=129→0） |
| 2 winpty | 整套 winpty 随包 + 预设别名 + vendor 文档；niu 无此概念、ConPTY 测试架在库 | ✅ 静态实证复现（TUI 活体演示未做，见尾注） |
| 3 提示符 git 税 | 113/362 ms vs 单次 29 ms；spawn 点逐行锚定 | ✅ 复现 |
| 4 体积 | 440 MB + 19.4 MB DLL vs ≈16 MB 无 DLL 本体（opt 载荷已诚实归位） | ✅ 实测 |
| 5 fork 稳定性 | 厂商 ReleaseNotes 两处 + 官方页/MSYS2 news/ASLR 不兼容 | ⚠️ **社区已知、本机未复现**（已标注，不冒充实测） |
| 6 启动链 | 26.3 vs 71.0 ms（min-of-20），≈2.3–2.7× | ✅ 复现（与 BENCH/startup.tsv 交叉印证） |
| 7 版本语义 | 5.2.37 msys 尾巴 vs 5.3.0 基线 + 83/83 台账 | ✅ 实测/台账锚定 |

门户使用纪律：数字原样引用；面 5 只能以「厂商/社区书面记录」口径出现；面 4 不得拿 1.3 GB 全树对比 440 MB（须用 ≈16 MB 本体口径并注明 opt）。
