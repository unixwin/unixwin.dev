# CARDS — 门户小卡片牌组（2026-10-19）

> 用法：每张卡独立成立，门户任选任意子集排版。格式：卡型【数字卡|叙事卡】标题 / 一句话 / 证据锚。
> 数字卡=有硬数字可直接放大；叙事卡=一句话主张。全部证据可在 HIGHLIGHTS.md / FACTS.json 对应节找到完整链。

---

【数字卡】零 fork
`( )` 和 `$()` 零进程创建——子壳在进程内完成，fd/退出码/信号语义与 GNU 一致。
锚：rubash/docs/architecture.md:25-33

【数字卡】路径方言全收
C:\ 、D:/ 、/d/ 、/cygdrive/d 、/mnt/d ——四大生态的路径写法一个 shell 全收，换 shell 不改脚本。
锚：rubash/docs/windows-path-contract.md；实测矩阵见 PATH-MATRIX.md

【叙事卡】MSYS 咒语之死
在 Git Bash 里你得学会 MSYS_NO_PATHCONV 这个词；在 niu 里这个词不存在——因为它不需要存在。
锚：GITBASH-KILLER.md 面 1（git blame -L 自然写法 rc=129 实录）

【数字卡】体积
Git Bash 440MB + 20MB msys-2.0.dll vs niu ≈16MB 零 DLL。
锚：GITBASH-KILLER.md 面 4（装机位实测）

【数字卡】提示符 git 税
Git Bash 默认提示符每次渲染 spawn git：113-362ms；niu 读 .git/HEAD：≤29ms。
锚：GITBASH-KILLER.md 面 3（真仓 min-of-20 实测）

【数字卡】一次性执行
`niu -c true` 26.3ms vs Git Bash 71ms；xgr 优化前 105.6ms→19.8ms。
锚：GITBASH-KILLER.md 面 6；niubash PR #267-#272

【叙事卡】上游插件直接跑
oh-my-bash、bash-it、bash-completion——一行不改，原生运行。没有 MSYS，没有 WSL。
锚：niubash crates/niubash-runtime/src/plugins/descriptors.rs:143/212/260（origin=官方上游仓）

【数字卡】83 套语料
GNU Bash 上游 83 套测试：100% 通过、82 套逐字节一致，唯一残差证明是 GNU 自己的竞态。
锚：rubash/README.md:17 与台账 :81-108

【数字卡】粘贴修复
多行粘贴自动执行 186→0 次；257 行载荷 300s 超时→4.6s。
锚：niubash PR #252/#288；scripts/perf/paste_multiline_bench.py

【数字卡】nvm 解析
重词法 checkpoint：720x 差距→8x，重词法字节 -40%。
锚：rubash PR #486

【数字卡】数组写入
K=5000 关联数组单次写快 45 倍、索引数组快 177 倍（O(n²)→O(1)）。
锚：rubash PR #650/#652

【数字卡】WinuxCmd 体积
3.79MB 携带 176 命令 / 1,924 选项，~19ms 冷启；PGO：sort −18%、nl −17%。
锚：WinuxCmd/README.md:32,:74

【叙事卡】为 agent 而设的旗标
`--encoded-command`（免引号 base64 通道）+ `--cwd-state`（一次性调用链的目录记忆）。
锚：niubash PR #271/#272；CHANGELOG

【叙事卡】引擎即库
rubash 已上 crates.io（1.4.0）；稳定嵌入 API + 四层 workspace 拆分蓝图已合并（1.5.0）。
锚：crates.io/crates/rubash；rubash/docs/design/1.5.0-workspace-and-engine-api.md

【叙事卡】调试器
DAP-first 设计定稿：`--debugger`，11 个停点 seam 全部锚定既有 DEBUG-trap 分发点；gdb 式 CLI REPL 双前端。
锚：rubash/docs/design/debugger-m0.md；rubash#497

【叙事卡】profiler
输入一个脚本，拿到函数级热点分布——AI 排障的主力工具。
锚：rubash#815；PR rubash#829

【叙事卡】零遥测
shell 不给任何服务器打电话：全仓 grep telemetry/analytics/sentry/posthog 零命中。
锚：2026-10-19 实测（FACTS.json telemetry 节）

【数字卡】测试硬门
rubash CI 硬门 698/0；niubash workspace 1026/0；WinuxCmd 每 PR 对 GNU 自动差分（178 例）。
锚：CI run 39191237754 / 39191023176；WinuxCmd "GNU master differential" workflow

【叙事卡】发行可溯源
发行资产锁定引擎 commit：pin+fail-hard，脏构建在 --version 里自曝。
锚：niubash PR #424；rubash#827 审计

【数字卡】跨平台
Windows x64/arm64 + Linux(gnu/musl) + macOS + Android×2 + OpenHarmony——五平台 CI 门禁。
锚：rubash/.github/workflows/ci.yml

【叙事卡】安全边界
rbash 启动语义对齐 GNU；路径契约成文；不可信生态资产只在 ephemeral runner 执行。
锚：niubash PR #413；windows-path-contract.md；eco-harvest-ci.yml

【数字卡】生态语料
2686 仓 / 9701 资产每夜巡检；6336 条真实资产判定原文入仓可回放。
锚：niubash/scripts/harvest/snapshots/；niubash#263

【叙事卡】欢迎贡献
外部 PR 欢迎且署名保留：cat 流式修复（#447）、xgr fork 六连入库。
锚：rubash PR #447；niubash PR #267-#272

【叙事卡】原生 TLS
niu-git = MSVC+CMake+schannel：无 OpenSSL、无捆绑 shell/perl，git 启动 ~14ms vs Git Bash 45-103ms。
锚：niu-git README；niubash/README.md:32
