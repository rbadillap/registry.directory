#!/bin/zsh
# The daily snapshot, unattended. launchd starts this once a day (or when the
# Mac wakes after missing the hour); it indexes main in a throwaway worktree so
# the archive gains today's snapshot, then discards everything else it wrote.
# data/ is not committed and nothing is deployed: the weekly deploy indexes
# again from the maintainer's checkout.
#
# Secrets stay where they are. The run goes through `pnpm index`, so Varlock
# asks 1Password for them, and a locked 1Password waits for Touch ID. A run
# nobody approves ends as `auth`, and the day is recorded as missed.
#
# One line per run is appended to the summary log, tab-separated:
#   started_at  outcome  seconds  commit  detail
# outcome is one of: archived, already, no-network, auth, snapshot-failed,
# setup-failed, failed, locked. `already` means today's snapshot existed (a
# manual run got there first). The full output of each run is kept next to it.
#
# Usage: run.sh            (what launchd calls)
#        run.sh --dry-run  (everything but the index: network, worktree, install)

emulate -L zsh
setopt pipefail no_unset

REPO="${REGISTRY_DIRECTORY_REPO:-${0:A:h:h:h:h:h}}"
LOG_DIR="${REGISTRY_DIRECTORY_LOG_DIR:-$HOME/Library/Logs/registry-directory}"
SUMMARY="$LOG_DIR/daily-index.tsv"
WORKTREE="${${TMPDIR:-/tmp}%/}/registry-directory-daily"
LOCK="$LOG_DIR/daily-index.lock"

# launchd starts jobs with a bare PATH: name what the run needs.
export PATH="$HOME/.local/share/mise/shims:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# A Mac that just woke may not have a network yet. Wait up to this long.
NETWORK_ATTEMPTS=20
NETWORK_PAUSE=30

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

mkdir -p "$LOG_DIR/runs"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RUN_LOG="$LOG_DIR/runs/${STARTED_AT//:/-}.log"
START_SECONDS=$SECONDS
COMMIT="-"

record() {
  local outcome="$1" detail="${2:-}"
  print -r -- "${STARTED_AT}	${outcome}	$((SECONDS - START_SECONDS))	${COMMIT}	${detail}" >> "$SUMMARY"
  print -r -- "outcome: ${outcome} ${detail}" >> "$RUN_LOG"
}

cleanup() {
  if [[ -d "$WORKTREE" ]]; then
    git -C "$REPO" worktree remove --force "$WORKTREE" >> "$RUN_LOG" 2>&1 || rm -rf "$WORKTREE"
  fi
  git -C "$REPO" worktree prune >> "$RUN_LOG" 2>&1
  rm -f "$LOCK"
}

# Two runs at once would share the worktree path. launchd does not overlap a
# job with itself, but a manual run can.
if ! ( set -o noclobber; print $$ > "$LOCK" ) 2> /dev/null; then
  if kill -0 "$(cat "$LOCK" 2> /dev/null)" 2> /dev/null; then
    record locked "another run is in progress"
    exit 0
  fi
  print $$ > "$LOCK"
fi
trap cleanup EXIT

{
  print "registry.directory daily snapshot, started $STARTED_AT"
  print "repo: $REPO"
} > "$RUN_LOG"

# 1. Network. GitHub answers for both the fetch below and the registries.
attempt=1
until curl -fsS --max-time 10 -o /dev/null https://api.github.com 2>> "$RUN_LOG"; do
  if (( attempt >= NETWORK_ATTEMPTS )); then
    record no-network "no network after $((NETWORK_ATTEMPTS * NETWORK_PAUSE))s"
    exit 0
  fi
  print "network not ready (attempt $attempt), waiting ${NETWORK_PAUSE}s" >> "$RUN_LOG"
  sleep $NETWORK_PAUSE
  (( attempt++ ))
done

# 2. A throwaway worktree of main, as GitHub has it. The maintainer's checkout,
# its branch and its uncommitted work are never touched.
setup() {
  git -C "$REPO" fetch --quiet origin main || return 1
  [[ -d "$WORKTREE" ]] && git -C "$REPO" worktree remove --force "$WORKTREE"
  git -C "$REPO" worktree add --quiet --detach "$WORKTREE" origin/main || return 1
  COMMIT="$(git -C "$WORKTREE" rev-parse --short HEAD)"
  print "worktree: $WORKTREE at $COMMIT"
  # Packages come from pnpm's store on this machine; the network only fills gaps.
  (cd "$WORKTREE" && pnpm install --frozen-lockfile --prefer-offline --silent) || return 1
}
if ! setup >> "$RUN_LOG" 2>&1; then
  record setup-failed "fetch, worktree or install failed; see $RUN_LOG"
  exit 1
fi

if (( DRY_RUN )); then
  record dry-run "network, worktree and install ok"
  exit 0
fi

# 3. The full run. Only a full run archives the snapshot; data/ it writes stays
# in the worktree and goes away with it.
(cd "$WORKTREE/apps/web" && pnpm index) >> "$RUN_LOG" 2>&1
rc=$?

today="$(date -u +%Y-%m-%d)"
if (( rc == 0 )); then
  if grep -q "snapshot ${today}: archived" "$RUN_LOG"; then
    record archived "$(grep -o "snapshot ${today}: archived.*" "$RUN_LOG" | tail -1)"
  elif grep -q "snapshot ${today}: already archived" "$RUN_LOG"; then
    record already "today's snapshot existed"
  else
    record snapshot-failed "$(grep -o "snapshot.*" "$RUN_LOG" | tail -1)"
    exit 1
  fi
  exit 0
fi

# Varlock stops before the indexer starts when 1Password gives it nothing:
# the approval was dismissed, timed out, or never seen.
if grep -qiE "1password|op://|authoriz|biometric|unlock|op plugin" "$RUN_LOG" \
   && ! grep -q "step 1/4" "$RUN_LOG"; then
  record auth "1Password did not release the secrets"
  exit 1
fi

record failed "index exited $rc; see $RUN_LOG"
exit 1
