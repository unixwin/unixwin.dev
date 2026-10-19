# PATH-MATRIX — 路径方言 × 三层实测兼容矩阵（对照审计产出，2026-10-19）

> 只读审计 + 探针，缺口只开票不修复。全部结论来自实际跑的命令，每行附探针 tag + 输出一行摘要（tag 即可复跑）。
> **#1230 铁律**：niu 侧探针一律 PowerShell `System.Diagnostics.ProcessStartInfo` 原生 argv 发起（PS 5.1，非 Git Bash 通道——MSYS 预转参数会假绿）；Git Bash 对照组在 `D:/Git/bin/bash.exe` 内执行；WSL 对照组经 `wsl.exe bash -c`。
> 实测环境：Win10 19045 x64。niu = Niubash 1.4.0 装机（`niu.exe` rubash git e785c3c8f610 / winuxcmd **1.1.14** 装机位 / niu-git **2.56.0.windows.2.niugit**）；对照 = Git Bash（`D:/Git`，GNU bash 5.2.37(1)-msys，git mingw64）与 WSL2（Ubuntu-GitLab）。
> 纪律：未触碰 `winuxcmd-wt-1231/1233`（`D:/repo/winuxcmd-wt-123*`，已定位规避）、D:/repo 主检出（只读探针）、portal-pack 其他文件。写侧探针全部落在审计自建区，收尾 Test-Path 双见证清理（8/8 before=True→after=False）。

## 实例化语义（读这张再看矩阵）

| 方言形 | 只读探针目标 | 写侧/仓库探针目标（审计自建，已清理） |
|---|---|---|
| `D:\repo` / `D:/repo` / `/d/repo` / `/cygdrive/d/repo` / `/mnt/d/repo` | 字面 D:\repo（主检出，只读） | 同形指向 `D:\aud-pmx-tmp`（含真仓 `repo`：niu-git init，branch master @ fdc8ba2） |
| `/d`（裸根） | 字面 D:\ 根 | `/d/aud-pmx-tmp/...`（裸根+分量） |
| `/tmp` | 双面虚拟挂载（见下） | `/tmp/aud-*`（=%TEMP%，我方地盘） |
| `/usr/bin` | applet 目录（只读） | 写侧规避（不写安装树） |
| `~` | C:\Users\cmx（只读） | 根写侧规避 |
| `~/x` | `C:\Users\cmx\x`（审计自建，已清理，内含真仓） | 同左 |
| `repo`（相对） | cwd=`D:\aud-pmx-tmp`（审计自建） | 同左 |

已知虚拟挂载（实测锚定）：niu/winuxcmd 的 `/` = `...\Niubash\winuxcmd`，`/tmp` = 用户 `%TEMP%`（`C:\Users\cmx\AppData\Local\Temp`），`/usr/bin` = `...\winuxcmd\usr\bin`，`~` = `C:\Users\cmx`。

---

## 主矩阵（对/部分/错 + 实际行为摘要）

| 方言 | ① rubash 内建面 | ② winuxcmd 外部面 | ③ niu-git 面 |
|---|---|---|---|
| `D:\repo` | **对**（引号/裸两式均通；反斜杠不被吞） | **对**（ls/cat/stat/cp 全绿） | **对**（status 真实输出） |
| `D:/repo` | **对** | **对** | **对** |
| `/d/repo` | **对** | **部分**：ls/cat/cp ✅，stat ❌ ENOENT → [#1244](https://github.com/unixwin/WinuxCmd/issues/1244) | **对**（真仓 status 全绿；指字面 D:\repo 得 "not a git repository"=解析到达） |
| `/d`（裸根） | **对**（cd→`/d/`；`[[ -d /d ]]` rc=0；test -f 裸根+分量 rc=0） | **部分**：ls 列真实 D:\ 内容 ✅，cat/cp ✅，stat ❌ → #1244 | **对**（解析级：`not a git repository` ≠ cannot change，双盘 cwd 交叉排除拼接假象） |
| `/cygdrive/d/repo` | **错** → [rubash#850](https://github.com/unixwin/rubash/issues/850)：cd/test/[[ ]]/source/重定向 全 ENOENT | **部分**：ls/cat/cp ✅（独此一家），stat ❌ | **错** → [niu-git#18](https://github.com/unixwin/niu-git/issues/18)：`cannot change to '/cygdrive/...'` |
| `/mnt/d/repo` | **对**（cd→pwd -P=`/d/repo`；source/重定向/test 全绿） | **部分**：ls/cat/cp ✅，stat ❌ | **错**（`cannot change`）→ #18；但 `niu -c 'git -C /mnt/...'` ✅（rubash passthrough 代译） |
| `/tmp` | **对**（=%TEMP%：cd→`/c/Users/cmx/AppData/Local/Temp`；source/重定向/test 见证落盘） | **对**（ls/cat/cp ✅；stat ✅ Size 19136512 与 stat %TEMP% 逐字节一致） | **部分**：可换目录但落点是 cwd 盘符根原生回退（C:\tmp/D:\tmp，**非 %TEMP%**，判别仓证伪）→ #18 |
| `/usr/bin` | **对**（=winuxcmd\usr\bin；写侧规避未测） | **部分**：ls/cat ✅，stat ❌；cp 规避未测 | **错**（`cannot change`；原生回退 `<cwd盘>:\usr\bin` 不存在）→ #18 |
| `~` | **对**（cd→`/c/Users/cmx`；source 负探针错误文本显 `C:/Users/cmx/...`=已展开） | **对（GNU 同形为）**：applet 不展开 tilde，错误干净（`ls: cannot access '~'`）；GNU coreutils 直调同行为 | **部分**：`git -C ~` 不展开=上游同形为；`niu -c 'git -C ~/x status'` ✅ 闭环 |
| `~/x` | **对**（cd→`/c/Users/cmx/x`；test -f rc=0；source 变量注入成功；重定向落盘见证） | **对（GNU 同形为）**：同 `~` | **部分**：直调 `cannot change to '~/x'`；经 niu passthrough ✅（真仓 status） |
| `repo`（相对） | **对**（cd→`/d/aud-pmx-tmp/repo`；六内建全绿） | **对**（ls/cat/cp/stat 全绿） | **对**（cwd=D:\aud-pmx-tmp 下真仓 status） |

---

## 逐格证据（探针 tag = 输出一行摘要）

### 层① rubash 内建面（`niu -c '...'`，PS 原生 argv）

cd 判定口径：`cd X; pwd -P` 的 rc 取末命令，故以 stderr + pwd -P 语义双证。

| tag | 探针要点 | 结果 |
|---|---|---|
| L1.pwdP.baseline | `pwd -P`（cwd=D:\aud-pmx-tmp） | rc=0 `/d/aud-pmx-tmp`（MSYS 风呈现） |
| L1.pwdP.root | `cd /; pwd -P` | `/c/Users/cmx/AppData/Local/Programs/Niubash/winuxcmd`（/ = winuxcmd 根） |
| L1.cd.bs.quoted / .unquoted | `cd 'D:\repo'` / `cd D:\repo` | 两式均 rc=0 `pwd -P`=`/d/repo`（反斜杠不被吞，unquoted 亦字面） |
| L1.cd.fs / .msys / .bare | `cd D:/repo` / `/d/repo` / `/d` | 均 ✅，pwd -P=`/d/repo` / `/d/repo` / `/d/` |
| L1.cd.cygdrive | `cd /cygdrive/d/repo` | ❌ `niu: cd: /cygdrive/d/repo: No such file or directory`（pwd 打印旧 cwd） |
| L1.cd.mnt | `cd /mnt/d/repo` | ✅ pwd -P=`/d/repo`（真折叠到 D:\repo） |
| L1.cd.tmp / .usrbin / .home / .homex / .rel | 见主矩阵 | `/c/Users/cmx/AppData/Local/Temp` / `...\winuxcmd\usr\bin` / `/c/Users/cmx` / `/c/Users/cmx/x` / `/d/aud-pmx-tmp/repo` 全 ✅ |
| L1.tf.* | `test -f <形>/b9-assets.diff`（/d 用真实存在文件复测 `/d/aud-pmx-tmp/audmark.txt`） | bs.quoted/.unquoted/fs/msys/mnt/tmp/usrbin/homex/rel rc=0 ✅；bare 复测 rc=0 ✅（首测 `/d/b9-assets.diff` rc=1 为正确否定——该文件在 D:\repo 不在 D:\ 根）；cygdrive rc=1 ❌；`test -f ~` rc=1（正确：~ 是目录） |
| L1.dd.* | `[[ -d <形> ]]` | bs/fs/msys/bare/mnt/tmp/usrbin/home/homex/rel rc=0 ✅；cygdrive rc=1 ❌ |
| L1.src.* | `source <形>/aud-src.sh; echo A=$AUD_PMX`（自建标记） | bs（引号/裸）/fs/msys/bare/mnt → `A=srcmark` ✅；tmp → `A=tmpmark` ✅；homex → `A=xmark` ✅；rel → `A=repomark` ✅；cygdrive ❌ `A=`空+ENOENT；负探针 usrbin/home/litrepo 错误文本干净且显解析路径（home 负探针显 `C:/Users/cmx/aud-nope-pmx.sh`=tilde 已展开） |
| L1.wr.* + W.* | `echo pmx-w > <形>/aud-out-*.txt` + PS Test-Path/内容双见证 | bs/fs/msys/bare/mnt/tmp/x/rel 全部落盘且内容=`pmx-w` ✅；cygdrive rc=1 ENOENT、见证 absent ❌；usrbin/~ 写侧规避未测 |

### 层② winuxcmd 外部面（applet 直调，PS 原生 argv）

| tag | 探针 | 结果 |
|---|---|---|
| L2.ls.bs/fs/msys/bare/cygdrive/mnt | `ls <形>` | 全 rc=0 且列真实内容：D:\repo 五形同列（`WinuxCmd │ _604-assets`）；bare 列 `$WINDOWS.~BT`（真 D:\ 根）；mnt=cygdrive=msys 深层交叉比对一致（`/cygdrive/d/repo/niubash` 与 `/d/repo/niubash` 同列 `AGENTS.md`） |
| L2.ls.home/homex | `ls ~` / `ls ~/x` | rc=2 `cannot access '~'`（applet 面不展开 tilde，GNU 同形为） |
| L2.ls.tmp/usrbin/rel | `ls /tmp` / `/usr/bin` / `repo` | 全 ✅（/tmp 列 %TEMP% 实内容；/usr/bin 列 applet） |
| L2.cat.bs/fs/msys/cygdrive/mnt | `cat <形>/b9-assets.diff` | 全 rc=0，首行 `diff --git a/crates/niubash-runtime/src/plugins/assets.rs`（同 D:\repo 版本） |
| L2.cat.bare | `cat /d/aud-pmx-tmp/audmark.txt` | rc=0 `audmark-pmx`（裸根+分量 ✅；首测 `/d/index.php` 输出空经 PS 验证该文件仅 1 字节 0x0A，非缺陷） |
| L2.cat.tmp/usrbin/rel | `cat /tmp/aud-pmx-mark.txt` / `/usr/bin/ls.exe` / `repo/file.txt` | `pmx-tmp-mark` ✅ / 二进制 rc=0（MZ 头）✅ / `hello-pmx` ✅ |
| L2.cat.home/homex | `cat ~` / `cat ~/x/audmark.txt` | rc=1 `No such file or directory`（tilde 不展开，GNU 同形为） |
| L2.stat.bs/fs | `stat D:\repo` / `D:/repo` | rc=0 `File: D:\repo` / `D:/repo` 81920 ✅ |
| L2.stat.msys/bare/cygdrive/mnt/usrbin | `stat /d/repo` `/d` `/cygdrive/d/repo` `/mnt/d/repo` `/usr/bin` | 全 rc=1 `cannot statx ... ENOENT` ❌ → #1244 |
| L2.stat.tmp/tmppos | `stat /tmp` vs `stat %TEMP%` | Size 19136512 逐字节一致（/tmp=%TEMP% ✅） |
| L2.stat.rel | `stat repo` | rc=0 4096 ✅ |
| L2.stat.bare.wdD/wdC | 影子目录法：cwd 下预置 `d`/`repo` 影子再 stat /d、/d/repo | 双盘 cwd 均 ENOENT——静态不识别，非 #1230 式 cwd 拼接漂移 |
| L2.cp.* + CPW | `cp <形>/audmark.txt <形>/aud-copy-*.txt` + Test-Path/内容 | bs/fs/msys/bare/cygdrive/mnt/tmp/rel 全部落盘内容=`audmark-pmx` ✅（/cygdrive 亦 ✅）；homex rc=1（tilde） |
| L2.6 cwdC 复测 | ls/cat/cp /d 形 自 cwd=C: | 全 rc=0 ✅（bare 方言无 cwd 依赖） |

### 层③ niu-git 面（`git -C <形> status --porcelain=v2 --branch`，直调）

| tag | 探针 | 结果 |
|---|---|---|
| L3.version | `git --version` | `git version 2.56.0.windows.2.niugit` |
| L3.C.bs/fs/msys/rel | 四形指真仓 | 全 rc=0：`# branch.oid fdc8ba2... # branch.head master │ ? aud-copy-rel.txt`（真实 status，含未跟踪行） |
| L3.C.bare+ | `-C /d/aud-pmx-tmp/repo/.git` | rc=128 `must be run in a work tree`（解析正确，上游 GIT_DIR 语义） |
| L3.C.bare | `-C /d`（cwd=D: 与 cwd=C: 双测） | 均 `fatal: not a git repository`（≠ cannot change）→ 实际换到 D:\，解析级 ✅ |
| L3.C.msys.lit / bs.lit | `-C /d/repo`、`-C D:\repo`（真实存在的非仓目录） | `not a git repository`（解析到达，语义正确——D:\repo 本非仓） |
| L3.C.cygdrive / mnt / usrbin / home / homex / nope | 非 repo 目标 | `cannot change to '...'` ❌（cygdrive/mnt/usrbin 缺位；~ 不展开=上游同形为；nope 为正确报错对照） |
| L3.C.tmp / tmp.cwdC / tmppos | `/tmp` 落点判别 | 双盘 cwd 均 "not a git repository"；判别仓置于 %TEMP% 后 `-C /tmp/aud-pmx/repo2` → `cannot change`——**/tmp ≠ %TEMP%**，落点为 cwd 盘符根原生回退（本机 C:\tmp、D:\tmp 恰均存在）→ #18 |
| L3.pt.msys/mnt/cyg/homex | `niu -c 'git -C <形> ...'` passthrough | msys ✅、mnt ✅（rubash 代译）、homex ✅（rubash 展开 tilde）、cyg ❌（rubash 自身不认，见 #850） |

---

## 独特性对照表（代表形抽测；niu 全集 = 差异化卖点）

| 方言形 | niu rubash 内建 | niu winuxcmd applet | niu-git -C | Git Bash bash | Git Bash ls.exe | Git for Windows git（PS 原生 argv） | 同 git 在 bash 内 | WSL bash / git |
|---|---|---|---|---|---|---|---|---|
| `D:\repo`（引号） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌（bash 吞反斜杠→`cd D:repo`） |
| `D:/repo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/d/repo` | ✅ | ✅（stat 除外 #1244） | ✅ | ✅ | ✅ | ❌ cannot change | ✅（bash argv 预转=false-green 通道，`command -v git`=/mingw64/bin/git） | ❌ |
| `/d` | ✅ | ls ✅ / stat ❌ | ✅（解析级） | ✅ | ✅ | ❌ | — | ❌ |
| `/cygdrive/d/repo` | ❌ #850 | ✅（stat 除外） | ❌ #18 | ❌ | ❌ | ❌ | — | ❌ |
| `/mnt/d/repo` | ✅（真折叠） | ✅（stat 除外） | ❌ #18（passthrough ✅） | ⚠️ **假阳性**：cd 成功但 `cygpath -w` = `D:\Git\mnt\d\repo`（安装根回退，影子目录恰存在；`head /mnt/d/repo/b9-assets.diff` cannot open 证伪） | ⚠️ 同假阳性（列出的是 D:\Git\mnt\d\repo 内容 `rubash│rubash-rc3`，非 D:\repo） | ❌ | — | ✅（drvfs 真挂载，git -C ✅） |
| `/tmp` | ✅ =%TEMP% | ✅ =%TEMP% | ⚠️ =`<cwd盘>:\tmp`（#18） | ✅ =Git 安装 tmp | ✅ | — | — | ✅ =Linux /tmp |
| `/usr/bin` | ✅ =applet 目录 | ls ✅ / stat ❌ | ❌ | ✅ | ✅ | — | — | ✅ =Linux /usr/bin |
| `~` / `~/x` | ✅ 展开 | ❌ 不展开（GNU 同形为） | ❌ 直调 / ✅ passthrough | ✅ 展开 | ❌ 不展开 | — | — | ✅（→/root） |
| `repo` 相对 | ✅ | ✅ | ✅ | — | — | — | — | — |

三条门户级独特性结论：
1. **`/d` 全家（含裸根 `/d`）**：niu 三层全认（stat 例外已开票）；对照里只有 Git Bash 的 bash/ls 认，且它的 git 在 PS 原生 argv 下不认（`-C /d/...` cannot change）——Git Bash 的"支持"依赖 bash argv 预转，离开 bash 即失效（#1230 教训的活体对照）；WSL 全不认。
2. **`/mnt/d`**：niu rubash 真折叠（pwd -P 归一为 `/d/repo`）；Git Bash 是**假阳性**（静默落到安装根 `D:\Git\mnt\d\repo`，目录恰存在则 cd 成功——地雷型假绿，cygpath 实证）；WSL 真认（drvfs）。即 /mnt 维度 niu 与 WSL 打平、胜 Git Bash；niu-git 直调缺位（#18）。
3. **`/cygdrive/d`**：winuxcmd applet 面（ls/cat/cp）是全表唯一 ✅；rubash 内建与 niu-git 反而缺位——"同一壳里 `test -f` 说没有、`ls` 说有"的跨层不一致已开票（rubash#850），收口后此行即 niu 独占卖点。
4. 附：niu rubash 对**未加引号的 `D:\repo`** 保留反斜杠字面（`cd D:\repo` ✅）；对照 GNU bash 语义吞反斜杠（WSL 实测 `cd D:\repo` → `cd D:repo` 报错）——Windows 亲和性偏差，对用户有利向。

---

## 缺口清单（只开票不修复；均引用 #1230 格式：实测环境/证据矩阵/病根形态/收敛点/P 级）

| 票 | 仓 | 一句话 | 矩阵波及格 |
|---|---|---|---|
| [#1244](https://github.com/unixwin/WinuxCmd/issues/1244)（P2） | unixwin/WinuxCmd | stat 盘符方言全链不识别：/d/repo、/d、/cygdrive、/mnt、/usr/bin 全 ENOENT，仅 Windows 形+/tmp+相对可用；#1232 的深路径扩展，影子目录法证明非 cwd 拼接 | ②层 /d/repo、/d、/cygdrive、/mnt、/usr/bin 的 stat 格 |
| [rubash#850](https://github.com/unixwin/rubash/issues/850)（P3） | unixwin/rubash | 内建面（cd/test -f/[[-d]]/source/重定向）不认 /cygdrive/d/*，同路径 applet 面可用——跨层方言集不一致 | ①层 /cygdrive 全行；③层 /cygdrive passthrough |
| [niu-git#18](https://github.com/unixwin/niu-git/issues/18)（P3） | unixwin/niu-git | -C 方言集与自家两面不对齐：/mnt、/cygdrive 拒识；/tmp 走 cwd 盘符根原生回退（≠ niu 的 %TEMP% 语义，落点随 cwd 盘符漂移） | ③层 /mnt、/cygdrive、/tmp、/usr/bin 格 |

非缺口记录（不开票）：applet 面不展开 `~` = GNU coreutils 同形为（shell 面已展开，passthrough 闭环）；`git -C ~` 不展开 = 上游 git 同形为。

---

## 边界与诚实备注

- 审计早期诊断批次（s00–s03）存在 harness 缺 `-c` 的脚本缺陷，产出的"niu 内建全灭"为**假象**，已定位并全量重跑；本矩阵无任何数据来自缺陷批次——此事故本身再次验证 #1230 铁律的反面：探针通道错了，结论全错。
- rubash cd 格 rc 口径：`cd X; pwd -P` 的 rc 为末命令所有，cd 失败靠 stderr + pwd 旧值双证（L1.cd.cygdrive 即此形态）。
- 写侧规避：安装树（/usr/bin 写、cp）与家目录根（~ 写）刻意未测，主矩阵标注"规避未测"；`~/x` 为审计自建目录（建前验证不存在，收尾见证移除）。
- 对照组 D:\Git\mnt\d\repo 影子目录为**既有现场遗留**，仅引用为证据，未清理未改动。
- 装机位版本：winuxcmd 1.1.14（#1230–#1242 同底座，修复波 v1.1.16 落地后本矩阵 stat/#1244 格需复测）；niubash 1.4.0；niu-git 2.56.0.windows.2.niugit。
- 探针临时区全部清理并 Test-Path 双见证（8/8 before=True→after=False：D:\aud-pmx-tmp、C:\Users\cmx\x、%TEMP%\aud-pmx、%TEMP%\aud-pmx-c、aud-pmx-mark.txt、aud-pmx-src.sh、aud-out-tmp.txt、aud-copy-tmp.txt；stray 扫描零残留）。
