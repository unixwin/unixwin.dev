# nvm.sh 载入挂起核查报告（探针 24 复核）

日期：2026-10-12 ｜ 核查代理 ｜ 时限：发布阻塞核查（90 分钟盒）
对象：huck 对比研究代理报告"探针 24：真实 nvm.sh 完整载入在 rubash master@41de8319 挂起（60s+ 无 stderr，仓库根目录复现）" vs README FINAL.md 台账行 "nvm.sh | v0.40.x loader loads byte-clean | 2026-10-10 | rubash#477"

## 裁定：c —— 当前 master Windows 原生真挂（探针 24 规范形态），已开 P0 issue

- **对比代理的挂起报告属实**：以其原二进制（主树 `D:/repo/rubash/target/release/rubash.exe`，`--version` 自证 `build: 41de8319 (release)`）在原 cwd（主树根）精确复现：`rc=124, 60005ms, stdout=0B, stderr=0B`。
- **但不是四个嫌疑方向里的 1（环境污染）/2（旧构建回归）**：干净环境（`env -u WINUXSH_ROOT -u RUBASH_ROOT -u __RUBASH_SHELL_ROOT`）下 Windows 原生 8/8 格全挂，且 41de8319（#501 前）与 764b9dde（#501 后）逐格一致；**是平台特定的引擎 PWD 形态缺陷**，Linux 原生完全正常。
- **README 声明需限定形态**：有 default alias 时（#477 台账形态）Windows 原生 633ms 通过——声明在该形态下为真；空 NVM_DIR（探针 24/perf 套件规范形态）下挂起。FINAL.md 该行已加警告注记。
- P0 issue（阻塞 1.4.0）：**https://github.com/unixwin/rubash/issues/537**（label: P0-critical / bug / platform:windows）

## 一、测量矩阵

环境：本机 Windows 10 19045 x64 + WSL2（GNU bash 5.3.0(1)-release `/usr/local/bin/bash`，owner 编译 2026-09-09，oracle）。守卫统一 WSL GNU `timeout -k 5 60`，stdin=`/dev/null`（与 `scripts/run-perf-suite.sh` harness 完全对齐）。探针：`benchmarks/24-nvm-load.sh`（`NVM_DIR=$PWD/target/perf-corpus/nvm-dir` 空 scratch；`. $PWD/benchmarks/corpus/nvm.sh` v0.40.8，5226 行，与本核查独立下载的 upstream v0.40.8 字节一致，cmp 验证）。"干净 tmp" = `C:/Users/cmx/AppData/Local/Temp/nvm-hang-verify/tmp`（放 nvm.sh 副本 + 等价内联探针）。"干净 env" = `env -u WINUXSH_ROOT -u RUBASH_ROOT -u __RUBASH_SHELL_ROOT`；"污染 env" = 三变量置位（WINUXSH_ROOT=`C:\Users\cmx\AppData\Local\Programs\Niubash\winuxcmd`，RUBASH_ROOT=`__RUBASH_SHELL_ROOT`=`D:\repo\rubash`）。

### Windows 原生（8 格）

| 构建 | 二进制来源 | env | cwd | 结果 |
|---|---|---|---|---|
| 41de8319 | 主树 exe（对比代理原二进制） | 干净 | 主树根 D:/repo/rubash | **TIMEOUT 60046ms，0B/0B** |
| 41de8319 | 主树 exe | 三变量 | 主树根 | **TIMEOUT 60013ms，0B/0B** |
| 41de8319 | 主树 exe | 干净 | 干净 tmp | **TIMEOUT 60014ms，0B/0B** |
| 41de8319 | 主树 exe | 三变量 | 干净 tmp | **TIMEOUT 60013ms，0B/0B** |
| 764b9dde | 本核查自建（`build: 764b9dde`） | 干净 | 克隆根 | **TIMEOUT 60022ms，0B/0B** |
| 764b9dde | 本核查自建 | 三变量 | 克隆根 | **TIMEOUT 60020ms，0B/0B** |
| 764b9dde | 本核查自建 | 干净 | 干净 tmp | **TIMEOUT 60051ms，0B/0B** |
| 764b9dde | 本核查自建 | 三变量 | 干净 tmp | **TIMEOUT 60015ms，0B/0B** |

### Linux 原生（WSL2，8 格；二进制为本核查自建，CARGO_TARGET_DIR=~/nvm-verify-target，产物拷回 D:/repo/research/nvm-verify/bin/）

| 构建 | env | cwd | 结果 |
|---|---|---|---|
| 41de8319 | 干净 | 克隆根（仓库根目录） | **rc=0，418ms，载入完成** |
| 41de8319 | 三变量 | 克隆根 | ENOENT：source 行报 nvm.sh 不存在（路径映射污染，见 §三；非挂起） |
| 41de8319 | 干净 | 干净 tmp | **rc=0，459ms，NVM_LOAD_OK** |
| 41de8319 | 三变量 | 干净 tmp | ENOENT（污染） |
| 764b9dde | 干净 | 克隆根 | **rc=0，415ms，载入完成** |
| 764b9dde | 三变量 | 克隆根 | ENOENT（污染） |
| 764b9dde | 干净 | 干净 tmp | **rc=0，401ms，NVM_LOAD_OK** |
| 764b9dde | 三变量 | 干净 tmp | ENOENT（污染） |

### GNU oracle 对照 + 机制证明格

| 配置 | 结果 |
|---|---|
| GNU 5.3.0，克隆根 | rc=0，125ms 完成 |
| GNU 5.3.0，干净 tmp | rc=0，116ms，NVM_LOAD_OK |
| **GNU 5.3.0 + 强制 `PWD=C:/Users/cmx`** | **`nvm_find_up .nvmrc` 挂死（外层守卫 124）——GNU 平价证明：循环合法，PWD 形态是分歧点** |

### 补充格（挂起取证 / 台账形态）

| 配置（主树 exe @41de8319，Windows 原生，cwd=tmp） | 结果 |
|---|---|
| `-n corpus/nvm.sh`（探针 23 形态） | rc=0，184ms |
| source 全文件但删 `nvm_process_parameters "$@"` | rc=0，315ms |
| `nvm_process_parameters --no-use` | rc=0，295ms |
| `nvm_auto use` | **TIMEOUT 30s，0B/0B** |
| `nvm_ls_current` | "system"，379ms 正常 |
| `nvm_resolve_local_alias default` | 空，319ms 正常 |
| `nvm_rc_version` | **TIMEOUT 30s，0B/0B（从未走到 nvm_err，故零 stderr）** |
| **NVM_DIR/alias/default=v22.11.0 存在（#477 台账形态）** | **rc=0，633ms，LOAD_RC=0 —— 不挂** |
| niu.exe 1.4.0（内嵌 rubash 41de8319）`echo $PWD` | `D:/repo/...` —— 产品壳同携带 |

## 二、根因链（全部实测锚定）

`nvm.sh v0.40.8` source 末尾 `nvm_process_parameters "$@"` → `nvm_auto use` → `nvm_ls_current`="system" → `nvm_resolve_local_alias default`=空 → `nvm_rc_version` → `nvm_find_nvmrc` → **`nvm_find_up`（corpus nvm.sh:606）**：

```bash
nvm_find_up() {
  local path_
  path_="${PWD}"
  while [ "${path_}" != "" ] && [ "${path_}" != '.' ] && [ ! -f "${path_}/${1-}" ]; do
    path_=${path_%/*}
  done
  nvm_echo "${path_}"
}
```

终止条件只有 `""`/`"."`/找到 `.nvmrc`。rubash Windows 原生 `$PWD` 恒为盘符斜杠形态（`src/builtins/pwd.rs:256` `env::set_var("PWD", host_path_to_slash_drive(&current))`，有意设计，无视继承 PWD——`PWD=/d/... rubash -c 'echo $PWD'` 实测仍报 `D:/...`）：`D:/repo/rubash` 剥到 `D:` 后 `${path_%/*}` 永不缩短 → **死循环**。GNU bash 5.3.0 被强制同形态 PWD 后同函数同挂（oracle 末行）——**循环是 nvm 的合法 POSIX 代码，引擎分歧在 PWD 形态不符合其自身 MSYS persona**（`--version` 自称 `x86_64-pc-msys`，而 GNU bash on MSYS 报 `/d/...`）。Linux 原生 PWD 为 POSIX 形态，`/mnt/d/...` 剥到空串正常终止，故完全不受影响。

零 stderr 的解释：挂点在 `nvm_err "No version provided and no .nvmrc file found"` 之前（GNU 正常路径该 stderr 可见，rc=1）。

### 引入点时间线（父子双构建实证留作 #537 后续，时间盒未做）

- 2026-08-02 `b6e89a35` "Normalize Windows slash-drive cwd display"——盘符形态首次
- 2026-09-27 17:17 `cf322dda` "bashdb: … canonical PWD form …"（pwd.rs +37/-5）——canonical 化，**高度疑似挂起引入点**
- 2026-09-27 19:50 `7dfdaeb0` perf harness + 24 探针入库（probe 24 基线 14402ms "完成"）
- #477 PERF-BASELINE 的完成数字应是 17:17 canonical 化落地前测得；其后 Windows 原生 probe 24 即挂。**#501（a800dc5b executor 性能重构）无关**：两提交逐格一致。

## 三、附带实锤：#477 env 污染机制独立复现（与本挂起正交）

`WINUXSH_ROOT`、`RUBASH_ROOT`、`__RUBASH_SHELL_ROOT` **任一存在**（逐一隔离，值 `D:\repo\rubash` / winuxcmd 路径）都使 rubash 脚本路径解析失效：Linux 原生二进制 `source "$PWD/nvm.sh"` 报 ENOENT（文件实际存在，干净格 0.4s 通过）。这就是 #477 "22 套件被路径映射污染 / dstack 50→0"的机制，harness 启动必须 `env -u` 三件套。注意它**不是**探针 24 挂起的原因（Windows 8/8 干净格全挂）。

## 四、对四个嫌疑方向的逐一排除

1. **环境污染**：排除为主因——干净 env 下 Windows 原生 8/8 全挂；但污染机制本身真实存在且已隔离（§三），huck 对比代理的方法论应补 env -u 纪律（其报告探针 24 结论本身没错）。
2. **旧构建**：排除——41de8319 与 764b9dde 逐格一致，#501 不是回归源；"当前 master 真挂"成立（Windows 原生）。
3. **复现条件**：cwd 内容/位置无关（主树根=克隆根=tmp 全挂）；终端形态未成变量（interop 管道 + stdin=/dev/null 与 PowerShell Start-Process 两形态同挂）；唯一形态变量是**平台**（Windows 原生挂、Linux 原生不挂）。
4. **真回归**：按 c 处理——已开 P0 issue #537，FINAL.md nvm 行加警告。

## 五、结论落地（已完成动作）

| 动作 | 状态 |
|---|---|
| P0 issue | https://github.com/unixwin/rubash/issues/537 （P0-critical/bug/platform:windows） |
| FINAL.md nvm 行警告注记 | 已改 `D:/repo/promotion-drafts/readme/FINAL.md`（只动该行，注明"有 default alias 时为真 + #537"） |
| 台账/勘误 | 结论 c，未按 a 改 huck-vs-rubash-20261012.md（对比代理报告事实正确；其"疑似回归或环境交互"猜测由本报告修正为"平台特定 PWD 形态缺陷"） |

## 六、复现命令（最小集）

```bash
# 精确复现（Windows，任意盘符 cwd，空 NVM_DIR）
cd D:/repo/rubash && wsl.exe -e bash -lc \
  'cd /mnt/d/repo/rubash && timeout -k 5 60 ./target/release/rubash.exe benchmarks/24-nvm-load.sh </dev/null; echo rc=$?'
# → rc=124，零输出

# 机制最小复现（GNU 亦挂 → 循环合法，PWD 形态是分歧）
/usr/local/bin/bash -c 'cd /; PWD=C:/x; echo "${PWD%/*}"'   # C:/x → C: → C: → …

# 不挂的形态（#477 台账口径）
mkdir -p nvm-dir/alias && echo v22.11.0 > nvm-dir/alias/default   # 有 default alias
```

## 七、核查纪律与过程备注

- 全部构建在本核查自有克隆 `D:/repo/research/nvm-verify/rubash`（niugit `C:/Users/cmx/AppData/Local/Programs/Niubash/winuxcmd/usr/bin/git.exe` + `D:/` 形态 clone 自主树，--no-hardlinks，禁 stash 未违，未触碰其他工作树；主树仅只读复用其 exe 与 cwd）。
- 临时文件：`C:/Users/cmx/AppData/Local/Temp/nvm-hang-verify/`（矩阵脚本 run-linux-matrix.sh / run-windows-cells.sh、原始 TSV results-{linux,windows,windows-native}.tsv、issue-body.md）。
- 首次 Windows 764b9dde 构建死于 cargo 包缓存锁（15 代理并发），重试成功（日志 win-build-764b9dde.log，cargo_rc=0，产物 `build: 764b9dde` 自证）。
- 本机高负载下 /mnt 路径有瞬时 ENOENT 抖动（多次观察到）；矩阵脚本带重试，污染格的 ENOENT 经逐一隔离证实为真污染而非抖动。
- cf322dda 父子双构建实证（精确引入点）留作 #537 首个 follow-up；现有时间线 + GNU 平价 + 基线完成记录三重证据足够定位方向。
