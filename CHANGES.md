# CHANGES — 最近两周门户级动态（2026-10-05 → 10-19，挑 10 条）

> 格式：日期 / 产品 / 一句话。均为主会话现场事件，证据=对应 PR/issue/release。

- 2026-10-14 / niubash / **v1.4.0 正式发布**（第八次点火，20 资产 @ 20ec3ef0；journey P3-S4 楔死界校准后全绿，run 38506862578）
- 2026-10-14 / rubash / v1.4.0 上 crates.io（rubash 1.4.0 三 crate 链上架）；wpm-source 索引同步入 niubash 1.4.0
- 2026-10-14 / niu-git / v2.55.0.4 发布（launcher 引号毁参数 + 消息形参改写双修，test-launcher.py 差分套件 49/49）
- 2026-10-14 / niubash / winget 原地升级 1.4.0 提交（PR #444854，微软侧验证中）；本地 release 安装链（Inno Setup）打通
- 2026-10-16~17 / WinuxCmd / v1.1.12→v1.1.14 连发（#1207 发现 v1.1.14 发布档缺 winuxcmd-shim.exe——装了等于没装）
- 2026-10-18 / rubash / 输入层三连交货：活动控制台 read 三面（#816）、#803 快照 autocrlf 归一（#808）、#809 bgwait 直 spawn（#834/#835）；#341 粘贴丢字符悬案关闭（#411）
- 2026-10-18 / rubash / debugger 三问定论（`--debugger` + DAP-first + 行级/函数入口停点，docs/design/debugger-m0.md）；#497 裁决落地
- 2026-10-19 / rubash / **#827 发行完整性审计定案（结论 B）**：v1.4.0 发行资产从错误源码状态构建（浮动克隆无 pin）——当日加固 PR niubash#424 落地（rubash-pin.json + fail-hard + 脏构建自曝），1.4.1 优先级上调
- 2026-10-19 / WinuxCmd / **v1.1.15 发布**：发布档首次可验证携带 winuxcmd-shim.exe（#1207/#1225）；niubash PR #427 发布 pin 随即升到 1.1.15（有意跳过 1.1.14）
- 2026-10-19 / WinuxCmd / 裸盘符根路径方言全命令审计（#1230-#1242）：15 命令误解析、共享层 canonicalize_path_w 一处修三连、mkdir 真写格最急；修复波已开工（进 v1.1.16）

附（同一窗口的非产品大事）：rubash 单日 7 PR 合并全部带独立 CR 轮（2026-10-19）；D 盘清理回收 +285GB（10-18 +163G、10-19 +122G）；portal 审计材料包即本包。
