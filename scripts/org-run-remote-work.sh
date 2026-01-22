#!/usr/bin/env bash
set -euo pipefail

# Event-driven org watcher for coordination + TODO updates.

COORD_FILE="docs/company/coordination.md"
TODO_FILE="docs/TODO.md"
ROLE_FILTER="${1:-}"
ROLE_FILTER_NORM=""
if [[ -n "$ROLE_FILTER" ]]; then
  ROLE_FILTER_NORM="$(printf '%s' "$ROLE_FILTER" | tr '[:upper:]' '[:lower:]')"
fi

if [[ ! -f "$COORD_FILE" || ! -f "$TODO_FILE" ]]; then
  echo "Missing $COORD_FILE or $TODO_FILE. Create them before running."
  exit 1
fi

if command -v fswatch >/dev/null 2>&1; then
  fswatch -o "$COORD_FILE" "$TODO_FILE" | while read -r _; do
    if [[ -z "$ROLE_FILTER" ]]; then
      echo "Change detected — check coordination + TODO"
    elif rg -iq "To: ${ROLE_FILTER}\\b|\\[${ROLE_FILTER}\\]" "$COORD_FILE"; then
      echo "Change detected for ${ROLE_FILTER} — read coordination + TODO, execute handoffs, post updates."
      echo "Relevant lines:"
      rg -n -C 2 "To: ${ROLE_FILTER}\\b|\\[${ROLE_FILTER}\\]" "$COORD_FILE" | tail -n 15
    fi
  done
elif command -v entr >/dev/null 2>&1; then
  if [[ -z "$ROLE_FILTER" ]]; then
    ls "$COORD_FILE" "$TODO_FILE" | entr -d sh -c 'echo "Change detected — check coordination + TODO"'
  else
    ls "$COORD_FILE" "$TODO_FILE" | entr -d sh -c "rg -iq \"To: ${ROLE_FILTER}\\\\b|\\\\[${ROLE_FILTER}\\\\]\" \"$COORD_FILE\" && echo \"Change detected for ${ROLE_FILTER} — read coordination + TODO, execute handoffs, post updates.\" && echo \"Relevant lines:\" && rg -n -C 2 \"To: ${ROLE_FILTER}\\\\b|\\\\[${ROLE_FILTER}\\\\]\" \"$COORD_FILE\" | tail -n 15"
  fi
else
  echo "fswatch/entr not found. Falling back to polling every 5s."
  last=""
  while true; do
    cur="$(stat -f "%m" "$COORD_FILE" "$TODO_FILE" 2>/dev/null || true)"
    if [[ "$cur" != "$last" ]]; then
      if [[ -z "$ROLE_FILTER" ]]; then
        echo "Change detected — check coordination + TODO"
      elif rg -iq "To: ${ROLE_FILTER}\\b|\\[${ROLE_FILTER}\\]" "$COORD_FILE"; then
        echo "Change detected for ${ROLE_FILTER} — read coordination + TODO, execute handoffs, post updates."
        echo "Relevant lines:"
        rg -n -C 2 "To: ${ROLE_FILTER}\\b|\\[${ROLE_FILTER}\\]" "$COORD_FILE" | tail -n 15
      fi
      last="$cur"
    fi
    sleep 5
  done
fi
