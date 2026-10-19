#!/usr/bin/env bash
# bgwait_750 Windows-side mechanism benchmark (rubash#809 follow-up).
# Method: interleaved rotation (rubash -> gnu-msys -> gnu-wsl per round),
# min-of-3 after 1 discarded warmup round, per-run timeout 120s,
# inner-window timing with `date +%s%N` (identical method on all runners).
set -u

RUBASH="D:/repo/rubash-wt-809/target/release/rubash-clean-fixed.exe"
GNU_MSYS="/usr/bin/bash"
WSL="wsl.exe"
WSL_DISTRO="Ubuntu-GitLab"
OUT="D:/repo/research/bgwait-20261018/results.tsv"
STARTUP_OUT="D:/repo/research/bgwait-20261018/startup.tsv"
TIMEOUT_SECS=120

WL_BGWAIT='i=0; while [ $i -lt 750 ]; do sleep 0 & i=$((i+1)); done; wait'
WL_FGEXT='i=0; while [ $i -lt 750 ]; do sleep 0; i=$((i+1)); done'
WL_BGSUB='i=0; while [ $i -lt 750 ]; do ( : ) & i=$((i+1)); done; wait'
WL_BGSPAWN='i=0; while [ $i -lt 750 ]; do sleep 0 & i=$((i+1)); done'
WL_LOOP='i=0; while [ $i -lt 750 ]; do i=$((i+1)); done'
WL_BGWAIT100='i=0; while [ $i -lt 100 ]; do sleep 0 & i=$((i+1)); done; wait'
WL_BGWAIT300='i=0; while [ $i -lt 300 ]; do sleep 0 & i=$((i+1)); done; wait'
WL_BGWAIT1500='i=0; while [ $i -lt 1500 ]; do sleep 0 & i=$((i+1)); done; wait'

declare -A WORKLOADS=(
  [bgwait750]="$WL_BGWAIT"
  [fgext750]="$WL_FGEXT"
  [bgsubshell750]="$WL_BGSUB"
  [bgspawnonly750]="$WL_BGSPAWN"
  [loop750]="$WL_LOOP"
  [bgwait100]="$WL_BGWAIT100"
  [bgwait300]="$WL_BGWAIT300"
  [bgwait1500]="$WL_BGWAIT1500"
)
ORDER=(bgwait750 fgext750 bgsubshell750 bgspawnonly750 loop750 bgwait100 bgwait300 bgwait1500)

now_ns() { date +%s%N; }

# Runs one timed sample; sets RUN_INNER_MS / RUN_OUTER_MS / RUN_RC.
run_one() {
  local runner="$1" wl="$2" t0 t1 out inner
  local timed_body="t0=\$(date +%s%N)
$wl
t1=\$(date +%s%N)
echo \$(( (t1 - t0) / 1000000 ))"
  t0=$(now_ns)
  case "$runner" in
    rubash)   out=$(timeout "$TIMEOUT_SECS" "$RUBASH" -c "$timed_body" 2>/dev/null) ;;
    gnu_msys) out=$(timeout "$TIMEOUT_SECS" "$GNU_MSYS" -c "$timed_body" 2>/dev/null) ;;
    gnu_wsl)  out=$(timeout "$TIMEOUT_SECS" "$WSL" -d "$WSL_DISTRO" -e bash -c "$timed_body" 2>/dev/null) ;;
  esac
  RUN_RC=$?
  t1=$(now_ns)
  RUN_OUTER_MS=$(( (t1 - t0) / 1000000 ))
  if [ "$RUN_RC" -eq 0 ]; then
    inner=$(printf '%s\n' "$out" | grep -E '^[0-9]+$' | tail -1)
    RUN_INNER_MS="${inner:-NA}"
  else
    RUN_INNER_MS="NA"
  fi
}

record() {
  # $1=workload-name $2=runner $3=round
  echo -e "$1\t$2\t$3\t${RUN_INNER_MS}\t${RUN_OUTER_MS}\t${RUN_RC}" >> "$OUT"
  echo "  $1 / $2 / r$3 -> inner=${RUN_INNER_MS}ms outer=${RUN_OUTER_MS}ms rc=${RUN_RC}" >&2
}

echo -e "workload\trunner\tround\tinner_ms\touter_ms\trc" > "$OUT"

echo -e "runner\tattempt\tstartup_ms" > "$STARTUP_OUT"
for runner in rubash gnu_msys gnu_wsl; do
  for attempt in 1 2 3 4 5; do
    t0=$(now_ns)
    case "$runner" in
      rubash)   "$RUBASH" -c 'exit' >/dev/null 2>&1 ;;
      gnu_msys) "$GNU_MSYS" -c 'exit' >/dev/null 2>&1 ;;
      gnu_wsl)  "$WSL" -d "$WSL_DISTRO" -- bash -c 'exit' >/dev/null 2>&1 ;;
    esac
    t1=$(now_ns)
    echo -e "$runner\t$attempt\t$(( (t1-t0)/1000000 ))" >> "$STARTUP_OUT"
  done
done

# warmup round (discarded)
echo "=== warmup round (discarded) ===" >&2
for wl_name in "${ORDER[@]}"; do
  wl="${WORKLOADS[$wl_name]}"
  for runner in rubash gnu_msys gnu_wsl; do
    run_one "$runner" "$wl"
  done
done

echo "=== measured rounds ===" >&2
for round in 1 2 3; do
  for wl_name in "${ORDER[@]}"; do
    wl="${WORKLOADS[$wl_name]}"
    for runner in rubash gnu_msys gnu_wsl; do
      run_one "$runner" "$wl"
      record "$wl_name" "$runner" "$round"
    done
  done
done
echo "done -> $OUT" >&2
