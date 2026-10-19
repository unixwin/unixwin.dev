# Perf suite results

- rubash: `GNU bash, version 5.3.0(1)-release (x86_64-pc-msys)`
- GNU:    `GNU bash, version 5.3.0(1)-release (x86_64-pc-linux-gnu)`
- commit: `unknown`
- generated: 2026-10-12T01:09:39Z

| probe | rubash ms | GNU ms | ratio | status |
|---|---:|---:|---:|---|
| 01-startup-empty | 26 | 8 | 3.2x | OK |
| 02-startup-fndef | 27 | 7 | 3.9x | OK |
| 04-loop-true-builtin-x2000 | 117 | 17 | 6.9x | OK |
| 05-arith-x5000 | 98 | 17 | 5.8x | OK |
| 06-strconcat-x5000 | 269 | 40 | 6.7x | OK |
| 07-fncall-noop-x5000 | 301 | 37 | 8.1x | OK |
| 08-cmdsub-true-x1000 | 90 | 583 | 0.2x | OK |
| 09-external-uname-x300 | 50 | 422 | 0.1x | OK |
| 10-pathmiss-x100 | 2039 | 30 | **68.0x** | OK |
| 11-pipeline-yes-head | 55 | 12 | 4.6x | OK |
| 12-pipe-echo-read-x2000 | 1144 | 1925 | 0.6x | OK |
| 13-readloop-gen-x2000 | 174 | 42 | 4.1x | OK |
| 14-glob-srcrels-x100 | 40 | 59 | 0.7x | OK |
| 15-expansion-x5000 | 551 | 65 | 8.5x | OK |
| 16-parse-flat8000 | 438 | 22 | **19.9x** | OK |
| 17-parse-flat8000-n | 114 | 16 | 7.1x | OK |
| 18-nested-brace-nst1-d200 | 61 | 8 | 7.6x | OK |
| 19-nested-brace-nst2-d200 | 116 | 8 | **14.5x** | OK |
| 20-as-fn-mkdir-p-rep40 | 53 | 10 | 5.3x | OK |
| 21-configure-head1374-n | 55 | 10 | 5.5x | OK |
| 22-configure-full-n | 287 | 56 | 5.1x | OK |
| 23-nvm-parse-n | 180 | 24 | 7.5x | OK |
| 24-nvm-load | - | 50 | - | TIMEOUT / gnu:OK |
| 25-yes-head-read | 1515 | 332 | 4.6x | OK |
