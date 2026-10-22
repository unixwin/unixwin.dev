#!/usr/bin/env node
/**
 * add-agent-en.mjs — 给 src/data/agents.json 的每个 agent 注入英文 sibling 字段
 * （oneLiner_en / mechanism_en / difficulty_en / steps_en / verify_en / rollback_en /
 *  notes_en / script.label_en）。只新增键，绝不改写任何中文字段值。
 * 幂等：重复运行覆盖同名 _en 键（以本文件译文为准）。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src', 'data', 'agents.json');
const data = JSON.parse(readFileSync(file, 'utf8'));

const VERIFY_EN = 'echo "SHELL=$SHELL"; uname -s — expect uname -s to start with MSYS_NT-';
const ROLLBACK_SHELL_EN =
  "[Environment]::SetEnvironmentVariable('SHELL', $null, 'User')";

/** @type {Record<string, any>} 译文按 slug 组织；缺省键回落中文。 */
const EN = {
  opencode: {
    mechanism_en: '$SHELL env var',
    difficulty_en: 'Easy',
    oneLiner_en:
      'Zero-config support: launch it from a niu session and it just works; a persisted SHELL covers every launch method.',
    script_label_en:
      'PowerShell · persist SHELL to the user environment (then every launch method picks it up)',
    steps_en: [
      'Most reliable path: type niu in a terminal to enter a session, then start opencode from there ($SHELL is visible automatically)',
      'To also cover Start-menu/desktop launches: run the persistence command above, then reopen the terminal',
    ],
    verify_en: VERIFY_EN,
    rollback_en: ROLLBACK_SHELL_EN,
    notes_en: [
      'The opencode binary contains zero niu-specific code — $SHELL is the entire mechanism',
      'Its self-updater probes for bin\\bash.exe three levels above git --exec-path and refuses to update when missing (niubash#376) — the niubash installer already places that file',
    ],
  },
  'claude-code': {
    mechanism_en: 'Git probe / CLAUDE_CODE_GIT_BASH_PATH',
    difficulty_en: 'Easy',
    oneLiner_en:
      'Works with no config by default: the installer drops a bash launcher right on the probe path; an env var can pin it explicitly.',
    script_label_en:
      'settings.json · pin it explicitly (not needed by default; only when the probe misses)',
    steps_en: [
      "Installing niubash is the whole job: the installer places a bash.exe launcher in C:\\Program Files\\Git\\bin, exactly hitting Claude Code's first probe",
      'If the probe misses, write the env block above into the Claude Code settings.json',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Remove env.CLAUDE_CODE_GIT_BASH_PATH from settings.json',
    notes_en: [
      'The variable only accepts paths whose file name is bash.exe / sh.exe / bash / sh — pointing it at niu.exe is silently ignored (that is why it targets the launcher, not niu itself)',
      'Since v2.1.120, a missing Git Bash falls back to PowerShell (instead of Linux)',
      'Historical pitfall: hopping through the launcher used to flash a console window per command (niubash#379); fixed in rubash#668 — upgrade to a build containing the fix and it is gone',
    ],
  },
  codex: {
    mechanism_en: 'Native Niu detection (unixwin fork)',
    difficulty_en: 'Zero-config',
    oneLiner_en:
      'The unixwin-maintained Codex fork ships ShellType::Niu built in — selected automatically once installed.',
    steps_en: [
      'Install the forked Codex and niubash — no configuration at all: detection checks C:\\Program Files\\Niubash\\niu.exe, the x86 path, %LOCALAPPDATA%\\Programs\\Niubash\\niu.exe, then niu on PATH, in order',
      'The exec whitelist already allows niu.exe with -C / -c / -lc / --repl-command',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Switch back to official Codex to restore the default shell table',
    notes_en: [
      'This is the target shape for every other integration: probe table and argument whitelist both live in upstream code',
    ],
  },
  zed: {
    mechanism_en: 'Explicit terminal.shell.program',
    difficulty_en: 'Easy',
    oneLiner_en:
      'A single setting: point terminal.shell.program at niu.exe, and the agent shares that terminal.',
    script_label_en: 'settings.json',
    steps_en: ["Open Zed's settings.json and write in the terminal.shell.program block above"],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.shell.program setting',
    notes_en: [],
  },
  goose: {
    mechanism_en: 'GOOSE_SHELL env var',
    difficulty_en: 'Easy',
    oneLiner_en:
      'One env var: on Windows the shell tool spawns GOOSE_SHELL and passes -c to any name that is not cmd/PowerShell — point it at niu.exe and done.',
    script_label_en: 'PowerShell · persist GOOSE_SHELL to the user environment',
    steps_en: [
      'Run the persistence command above, reopen the terminal, then start goose',
      'Have goose run any command (say ls) and confirm the output is bash dialect, not cmd',
    ],
    verify_en:
      'echo "SHELL=$SHELL"; uname -s — expect MSYS_NT- (goose\'s shell tool goes through niu -c at this point)',
    rollback_en:
      "[Environment]::SetEnvironmentVariable('GOOSE_SHELL', $null, 'User')",
    notes_en: [
      'Source-verified (2026-10-21 HEAD, block/goose crates/goose/src/agents/platform_extensions/developer/shell.rs): windows_shell() reads GOOSE_SHELL, defaulting to cmd; argument style dispatches by file name — pwsh/powershell → -Command, cmd → /C, everything else → -c. niu.exe lands in the -c branch, exactly niu\'s one-shot syntax',
      'This entry is a read-the-release-source conclusion, not machine-tested; agents.md previously listed Goose under "Not verified here" — added via this code read',
      "Goose's desktop app has separate login-shell logic (ui/desktop loginShellPath); the CLI behavior is authoritative",
    ],
  },
  dsh: {
    mechanism_en: 'Plugin profile',
    difficulty_en: 'Easy',
    oneLiner_en:
      'One command installs the plugin bundle: enables niu-sandbox and tool-bash, and disables the PowerShell row.',
    script_label_en: 'Command line',
    steps_en: [
      "Run the plugin install command above; a niubash option appears in DSH's settings card",
    ],
    verify_en: 'The DSH settings card shows niu-sandbox / tool-bash as enabled',
    rollback_en:
      'Uninstall the profile plugin bundle (uninstall command in its README); the settings-card entry goes away with it',
    notes_en: [
      'The community also offers a same-spirit dsh-niubash-only profile',
      'DSH ships no official icon asset; the card uses a generic placeholder icon',
    ],
  },
  'vs-code': {
    mechanism_en: 'Git probe / automationProfile',
    difficulty_en: 'Easy',
    oneLiner_en:
      "The family anchor: one shared probe rules the whole VS Code lineage — the Copilot agent runs commands through the editor's automation terminal and hits it by default.",
    script_label_en:
      'settings.json · explicit automationProfile (the probe hits by default; this is for precise control)',
    steps_en: [
      'Default: the installer-placed C:\\Program Files\\Git\\bin\\bash.exe hits the family-shared probe — no configuration needed',
      'For precise control: point automationProfile at niu.exe and every agent running through the automation terminal inherits it',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.integrated.automationProfile.windows setting',
    notes_en: [
      'The family shares one hard-coded probe sequence (the two Program Files Git paths → bin/bash.exe next to git on PATH); fix it once and the whole family follows',
      'The probe sequence was read from a ZCode app.asar (verified locally); same-lineage products behave the same way',
    ],
  },
  windsurf: {
    mechanism_en: 'Git probe / automationProfile (VS Code family)',
    difficulty_en: 'Easy',
    oneLiner_en:
      'VS Code lineage (Code OSS fork): the automation terminal inherits the family probe — hits the launcher by default once niubash is installed.',
    script_label_en: 'settings.json · automationProfile (same as the VS Code entry)',
    steps_en: [
      'Default: the family-shared probe hits the installer-placed bash launcher — no configuration needed',
      'For precise control: point automationProfile at niu.exe',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.integrated.automationProfile.windows setting',
    notes_en: [
      'The family-probe section of agents.md names Windsurf; not machine-tested — inferred from the shared lineage',
      'If it falls back to PowerShell, setting automationProfile is enough',
    ],
  },
  trae: {
    mechanism_en: 'Git probe / automationProfile (VS Code family)',
    difficulty_en: 'Easy',
    oneLiner_en:
      'VS Code lineage fork: the automation terminal inherits the family probe — hits the launcher by default once niubash is installed.',
    script_label_en: 'settings.json · automationProfile (same as the VS Code entry)',
    steps_en: [
      'Default: the family-shared probe hits the installer-placed bash launcher — no configuration needed',
      'For precise control: point automationProfile at niu.exe',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.integrated.automationProfile.windows setting',
    notes_en: [
      'The family-probe section of agents.md names Trae; not machine-tested — inferred from the shared lineage',
    ],
  },
  kiro: {
    mechanism_en: 'Git probe / automationProfile (VS Code family)',
    difficulty_en: 'Easy',
    oneLiner_en:
      "AWS's agentic IDE (Code OSS lineage): the automation terminal picks its shell via the shared family probe — hits the launcher by default once niubash is installed.",
    script_label_en: 'settings.json · automationProfile (same as the VS Code entry)',
    steps_en: [
      'Default: the family-shared probe hits the installer-placed bash launcher — no configuration needed',
      'For precise control: point automationProfile at niu.exe',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.integrated.automationProfile.windows setting',
    notes_en: [
      'Kiro is not named in the agents.md family list — this entry infers the shared probe from its Code OSS lineage; not machine-tested, updates to follow after real testing',
      'If it falls back to PowerShell, setting automationProfile is enough',
    ],
  },
  zcode: {
    mechanism_en: 'Git probe / automationProfile (VS Code family)',
    difficulty_en: 'Easy',
    oneLiner_en:
      'The family probe was verified on this very editor: the shared probe sequence in agents.md comes from reading a ZCode app.asar — hits it by default.',
    script_label_en: 'settings.json · automationProfile (same as the VS Code entry)',
    steps_en: [
      'Default: the family-shared probe hits the installer-placed bash launcher — no configuration needed',
      'For precise control: point automationProfile at niu.exe',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.integrated.automationProfile.windows setting',
    notes_en: [
      'The probe sequence in agents.md is sourced from "ZCode app.asar read locally" — this is the only family member verified per-machine',
      'ZCode ships no official icon asset; the card uses a generic placeholder icon',
    ],
  },
  cline: {
    mechanism_en: 'Editor terminal / automationProfile (extension)',
    difficulty_en: 'Easy',
    oneLiner_en:
      'VS Code extension: commands run through the editor terminal or an automation profile and inherit the family probe — the extension itself never picks a shell.',
    script_label_en:
      'settings.json · automationProfile (set in the host editor; extensions inherit it)',
    steps_en: [
      'Default: the host editor\'s family probe hits the installer-placed bash launcher — no configuration needed',
      'For precise control: set automationProfile to niu.exe in the host editor',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.integrated.automationProfile.windows setting',
    notes_en: [
      'The agents.md family section names this group: extensions using the editor terminal or an automation profile (Cline, Roo Code, Kilo Code, Continue) all inherit it',
    ],
  },
  'roo-code': {
    mechanism_en: 'Editor terminal / automationProfile (extension)',
    difficulty_en: 'Easy',
    oneLiner_en:
      'VS Code extension: commands run through the editor terminal or an automation profile and inherit the family probe.',
    script_label_en:
      'settings.json · automationProfile (set in the host editor; extensions inherit it)',
    steps_en: [
      'Default: the host editor\'s family probe hits the installer-placed bash launcher — no configuration needed',
      'For precise control: set automationProfile to niu.exe in the host editor',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.integrated.automationProfile.windows setting',
    notes_en: ['Named in the agents.md family section: Roo Code'],
  },
  'kilo-code': {
    mechanism_en: 'Editor terminal / automationProfile (extension)',
    difficulty_en: 'Easy',
    oneLiner_en:
      'VS Code extension: commands run through the editor terminal or an automation profile and inherit the family probe.',
    script_label_en:
      'settings.json · automationProfile (set in the host editor; extensions inherit it)',
    steps_en: [
      'Default: the host editor\'s family probe hits the installer-placed bash launcher — no configuration needed',
      'For precise control: set automationProfile to niu.exe in the host editor',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.integrated.automationProfile.windows setting',
    notes_en: ['Named in the agents.md family section: Kilo Code'],
  },
  continue: {
    mechanism_en: 'Editor terminal / automationProfile (extension)',
    difficulty_en: 'Easy',
    oneLiner_en:
      'VS Code extension: commands run through the editor terminal or an automation profile and inherit the family probe.',
    script_label_en:
      'settings.json · automationProfile (set in the host editor; extensions inherit it)',
    steps_en: [
      'Default: the host editor\'s family probe hits the installer-placed bash launcher — no configuration needed',
      'For precise control: set automationProfile to niu.exe in the host editor',
    ],
    verify_en: VERIFY_EN,
    rollback_en: 'Delete the terminal.integrated.automationProfile.windows setting',
    notes_en: ['Named in the agents.md family section: Continue'],
  },
  cursor: {
    mechanism_en: 'Detection chain currently bash-unfriendly',
    difficulty_en: 'Medium',
    oneLiner_en:
      'The IDE side has a workaround (Legacy Terminal Tool); the Agent CLI currently hard-codes PowerShell and cannot be configured.',
    script_label_en: 'settings.json · IDE workaround (enable the legacy terminal tool)',
    steps_en: [
      'IDE agent: turn on the Legacy Terminal Tool setting; pair it with the useWslProfiles:false above so it does not fall into WSL',
      'Agent CLI: not configurable for now (detectShellType() unconditionally prefers PowerShell on Windows) — reported upstream, waiting for it to expose a shell path',
    ],
    verify_en:
      'echo "SHELL=$SHELL"; uname -s — observe which shell it actually falls back to',
    rollback_en: 'Turn off Legacy Terminal Tool / delete the useWslProfiles setting',
    notes_en: [
      'Until upstream fixes it, CLI-side commands run with PowerShell syntax — not a bash syntax error',
      'Cursor is VS Code lineage, but both of its products bypass the family-shared probe — agents.md lists it separately, outside the family group',
    ],
  },
  devin: {
    mechanism_en: 'No native integration · launches from a niu session',
    difficulty_en: 'Medium',
    oneLiner_en:
      'Investigation: the Devin CLI has no native niubash integration; it launches from a niu session, but devin setup and other Win32 console TUIs white-screen today — niubash#455 is open.',
    steps_en: [
      'Launch devin straight from a niu session: non-TUI paths output fine (when stdout is a pipe, it takes the ANSI fallback)',
      'devin setup and other interactive TUIs will white-screen and hang until fixed — watch niubash#455 instead of retrying',
      'To get through login, temporarily run devin setup in a plain terminal (PowerShell / Windows Terminal), then return to the niu session to work',
    ],
    verify_en:
      'echo "SHELL=$SHELL"; uname -s — a niu session shows the MSYS_NT- signature; Devin\'s own shell choice is unverified',
    rollback_en: 'No site-side configuration — this entry changes no settings',
    notes_en: [
      'Investigation (2026-10-21): neither the niubash repo code nor its docs contain any Devin-specific integration (no ShellType::Niu-style probe, no plugin profile, no install hook); agents.md lists Devin under "Not verified here" — the "native niubash integration" claim does not hold',
      'niubash#455 (open, P1-high): devin.exe v3000.11.92 uses the legacy Win32 console API (ReadConsoleInputW / SetConsoleCursorPosition) when stdout is a real console — white screen + dead keys; with stdout as a pipe it takes the ANSI fallback path and works — a console-services gap of the native TUI, not a VT parsing problem',
      'Two Devin bugs of its own (recorded in #455, machine-tested): the install script pipes curl to bash with no tty check and unconditionally runs devin setup; setup does not exit on stdin EOF',
      "Once #455 lands (rubash#913 already fixed the one-hidden-console-per-session spawn front; the TUI console channel is a separate one), this entry's status updates — the issue is authoritative",
    ],
  },
  'qwen-code': {
    mechanism_en: 'MSYSTEM/TERM sniffing + Git Bash path lookup (its own)',
    difficulty_en: 'Medium',
    oneLiner_en:
      'After forking gemini-cli it grew its own MSYSTEM/TERM sniffing and Git Bash lookup — set MSYSTEM=MINGW64 (experimental) to hit the installer-placed bash launcher.',
    script_label_en: 'PowerShell · set MSYSTEM (experimental — see notes)',
    steps_en: [
      'Run the command above to persist MSYSTEM=MINGW64 to the user environment; reopen the terminal to take effect',
      'Once Qwen Code\'s isGitBash branch hits, it looks for bash.exe along PATH → C:\\Program Files\\Git\\bin\\bash.exe — the latter is placed by the niubash installer, so a hit routes through the launcher into niu',
    ],
    verify_en:
      'echo $MSYSTEM; echo "SHELL=$SHELL"; uname -s — MSYSTEM=MINGW64 and uname reporting MSYS_NT- means the bash branch was taken',
    rollback_en:
      "[Environment]::SetEnvironmentVariable('MSYSTEM', $null, 'User')",
    notes_en: [
      'Source-verified (2026-10-21 HEAD, QwenLM/qwen-code packages/core/src/utils/shell-utils.ts getShellConfiguration()): MSYSTEM prefixed MINGW/MSYS, or TERM containing msys/cygwin → findGitBashPath() (scan PATH for bash.exe → the two hard-coded Program Files paths); otherwise falls back to ComSpec (cmd/PowerShell)',
      'Unlike upstream Gemini CLI\'s "unconditional PowerShell": Qwen Code forked from gemini-cli v0.8.2 (stated in the README acknowledgments) and has evolved independently since v0.1 — the two integration states do not transfer',
      'agents.md trap clause: MSYSTEM is empty by default inside a niu session; setting it is an untested experiment and changes how other MSYS-aware tools behave',
      'A read-the-code conclusion, not machine-tested; can be promoted to ready once machine-tested',
    ],
  },
  'gemini-cli': {
    mechanism_en: 'Unconditional PowerShell',
    difficulty_en: '—',
    oneLiner_en:
      'The shipped code returns PowerShell on Windows outright — no bash branch; two upstream proposals track this.',
    steps_en: [
      'No configuration exists yet. Watch upstream issue #26567 (MSYSTEM sniffing) and PR #18367 (locate git bash via PATH)',
    ],
    verify_en: '—',
    rollback_en: '—',
    notes_en: [
      'On machines with locked-down execution policies it also stalls outright on the PowerShell execution policy',
      'Qwen Code grew its own sniffing after the fork — the two states differ; see the Qwen Code entry',
    ],
  },
  aider: {
    mechanism_en: 'No shell option',
    difficulty_en: '—',
    oneLiner_en:
      '/run always uses PowerShell or cmd; launching from inside niu does not change its choice.',
    steps_en: ['Not supported yet — waiting for upstream to add a shell option'],
    verify_en: '—',
    rollback_en: '—',
    notes_en: ['What the model sees in its environment reports Shell: COMSPEC=…'],
  },
  'amazon-q': {
    mechanism_en: 'Unverified',
    difficulty_en: '—',
    oneLiner_en:
      'Not verified yet: no local test or code read. Wire it via the universal four-mechanism guide and report back.',
    steps_en: [
      'Read the four-mechanism decision flow on the universal guide (/en/agents/universal/) to work out which mechanism your build reads',
      'Easiest start: launch from a niu session (mechanism 1) and run the verify command to read the signature',
      'With a conclusion, please open a PR back at github.com/unixwin/unixwin.dev',
    ],
    verify_en:
      'echo "SHELL=$SHELL"; uname -s — interpret against the universal signature table',
    rollback_en: '—',
    notes_en: [
      'On the agents.md "Not verified here" list',
      'AWS trademark assets not localized; the card uses a generic placeholder icon',
    ],
  },
  amp: {
    mechanism_en: 'Unverified',
    difficulty_en: '—',
    oneLiner_en:
      'Not verified yet: no local test or code read (a Sourcegraph product, mostly closed source). Wire it via the universal guide.',
    steps_en: [
      'Read the four-mechanism decision flow on the universal guide (/en/agents/universal/)',
      'Launch from a niu session (mechanism 1) and run the verify command to read the signature',
      'With a conclusion, please open a PR back at github.com/unixwin/unixwin.dev',
    ],
    verify_en:
      'echo "SHELL=$SHELL"; uname -s — interpret against the universal signature table',
    rollback_en: '—',
    notes_en: ['On the agents.md "Not verified here" list'],
  },
  openhands: {
    mechanism_en: 'Unverified',
    difficulty_en: '—',
    oneLiner_en:
      'Not verified yet: command execution usually happens inside a container/sandbox — where the host shell plugs in is still unverified.',
    steps_en: [
      'Read the four-mechanism decision flow on the universal guide (/en/agents/universal/)',
      'Launch from a niu session (mechanism 1) and run the verify command to read the signature',
      'With a conclusion, please open a PR back at github.com/unixwin/unixwin.dev',
    ],
    verify_en:
      'echo "SHELL=$SHELL"; uname -s — interpret against the universal signature table',
    rollback_en: '—',
    notes_en: ['On the agents.md "Not verified here" list'],
  },
  junie: {
    mechanism_en: 'Unverified',
    difficulty_en: '—',
    oneLiner_en:
      'Not verified yet: runs inside JetBrains IDEs; whether the host terminal\'s shell setting reaches its command execution is unverified.',
    steps_en: [
      'Read the four-mechanism decision flow on the universal guide (/en/agents/universal/)',
      'Point the IDE\'s built-in terminal at niu.exe, trigger Junie from that terminal, and run the verify command to read the signature',
      'With a conclusion, please open a PR back at github.com/unixwin/unixwin.dev',
    ],
    verify_en:
      'echo "SHELL=$SHELL"; uname -s — interpret against the universal signature table',
    rollback_en: '—',
    notes_en: [
      'agents.md lists "editor agents outside the VS Code lineage" as unverified',
      'The card uses a JetBrains vendor mark; a standalone Junie brand asset is not localized',
    ],
  },
};

let patched = 0;
let missing = [];
for (const agent of data.agents) {
  const en = EN[agent.slug];
  if (!en) {
    missing.push(agent.slug);
    continue;
  }
  agent.oneLiner_en = en.oneLiner_en;
  agent.mechanism_en = en.mechanism_en;
  agent.difficulty_en = en.difficulty_en;
  if (agent.script) {
    agent.script.label_en = en.script_label_en ?? agent.script.label;
  }
  agent.steps_en = en.steps_en ?? agent.steps;
  agent.verify_en = en.verify_en ?? agent.verify;
  agent.rollback_en = en.rollback_en ?? agent.rollback;
  agent.notes_en = en.notes_en ?? agent.notes;
  patched++;
}

if (missing.length) {
  console.error('缺译 slug：', missing.join(', '));
  process.exit(1);
}

writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`已注入 ${patched}/${data.agents.length} 条 agent 的 _en 字段 → ${file}`);
