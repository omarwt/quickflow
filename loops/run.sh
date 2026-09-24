#!/usr/bin/env bash
# run.sh - start a Claude Loop.
#
#   loops/run.sh <backend-dev|frontend-dev|orchestrator> --input <PRD.md | story.md | "story text">
#                [--mode prd|story] [--phase <ID>] [--resume] [--headless]
#
# Default: opens an interactive Claude Code session (you watch and approve).
# --headless: runs unattended with `claude -p` and records the real session id.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOOP="${1:?usage: run.sh <loop> --input ...}"; shift
INPUT=""; MODE=prd; PHASE=""; RESUME=no; HEADLESS=no
while [[ $# -gt 0 ]]; do
  case "$1" in
    --input) INPUT="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --phase) PHASE="$2"; shift 2 ;;
    --resume) RESUME=yes; shift ;;
    --headless) HEADLESS=yes; shift ;;
    *) echo "unknown option $1" >&2; exit 64 ;;
  esac
done
[[ -d "$ROOT/loops/$LOOP" ]] || { echo "no such loop: $LOOP" >&2; exit 64; }
[[ -n "$INPUT" || $RESUME == yes ]] || { echo "--input is required (or --resume)" >&2; exit 64; }

# A story passed as text becomes a file so the loop has a stable input.
if [[ -n "$INPUT" && ! -f "$ROOT/$INPUT" && ! -f "$INPUT" ]]; then
  mkdir -p "$ROOT/loops/$LOOP/inputs"
  f="loops/$LOOP/inputs/story-$(date +%Y%m%d-%H%M%S).md"
  printf '# User story\n\n%s\n' "$INPUT" > "$ROOT/$f"
  INPUT="$f"; MODE=story
fi

PROMPT="Run the Claude Loop '$LOOP'. Follow loops/$LOOP/Loop-instructions.md exactly.
Input: ${INPUT:-(from state)} | Mode: $MODE | Phase: ${PHASE:-all runnable phases} | Resume: $RESUME
All state changes go through python3 loops/_lib/loop.py. Stop when the selected phases are done or blocked."

cd "$ROOT"
if [[ $HEADLESS == no ]]; then
  exec claude --mcp-config .mcp.json "$PROMPT"
fi
OUT="$(mktemp)"
claude -p "$PROMPT" --mcp-config .mcp.json --output-format json \
  --allowedTools "Bash Read Edit Write Glob Grep mcp__playwright__*" > "$OUT" || true
SID="$(jq -r '.session_id // "unavailable"' "$OUT")"
python3 loops/_lib/loop.py track --session "$SID" --loop "$LOOP" --phase "${PHASE:--}" --requirement "${INPUT:-resume}" \
  --prompt "$PROMPT" --status "$(jq -r 'if .is_error then "Failed" else "Completed" end' "$OUT")" \
  --notes "headless run"
jq -r '.result // "no result"' "$OUT"
