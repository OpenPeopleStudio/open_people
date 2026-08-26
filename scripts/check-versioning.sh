#!/usr/bin/env bash
# check-versioning.sh — release metadata watcher (Mars / SWL / dating contract)
#
# Usage:
#   ./scripts/check-versioning.sh           # repo root = parent of scripts/
#   REPO_ROOT=/path/to/scope ./check-versioning.sh
#
# Works for nested git packages (e.g. ~/mars/packages/foo) and standalone repos.
# Soft WATCH: code without stamp, ACTIONS lag.
# Hard FAIL: VERSION vs top CHANGELOG mismatch, or one of VERSION/CHANGELOG moves alone.

set -u

if [[ -n "${REPO_ROOT:-}" ]]; then
  ROOT="$REPO_ROOT"
elif [[ -f "$(pwd)/VERSION" && -f "$(pwd)/CHANGELOG.md" ]]; then
  ROOT="$(pwd)"
else
  ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi
MODE="${1:-}"
failures=0
warnings=0

is_doc_or_release_file() {
  local path="$1"
  local base
  base="$(basename "$path")"
  case "$base" in
    VERSION|CHANGELOG.md|ACTIONS|CLAUDE.md|Claude.md|Agents.md|AGENTS.md|README.md|HANDOFF.md|BACKLOG.md|TODO.md|VISION.md|DEBATES.md|DESIGN_RULES.md|FINEPRINT.md|SKELETON.md)
      return 0
      ;;
  esac
  case "$path" in
    *.md|docs/*|*/docs/*|plans/*|*/plans/*|specs/*|*/specs/*|prompts/*|decisions/*|*/decisions/*|futures/*|design/*|scripts/check-versioning.sh|*/scripts/check-versioning.sh)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

git_root="$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$git_root" ]]; then
  echo "VERSION WATCH: $ROOT not in a git work tree — skip"
  exit 0
fi

if [[ "$git_root" == "$ROOT" ]]; then
  rel="."
else
  rel="${ROOT#"$git_root"/}"
fi

changed_files() {
  {
    git -C "$git_root" diff --name-only -- "$rel" 2>/dev/null
    git -C "$git_root" diff --cached --name-only -- "$rel" 2>/dev/null
    git -C "$git_root" ls-files --others --exclude-standard -- "$rel" 2>/dev/null
  } | awk 'NF' | sort -u
}

# Map git path → path relative to scope ROOT
to_local() {
  local file="$1"
  if [[ "$rel" == "." ]]; then
    printf '%s\n' "$file"
  else
    printf '%s\n' "${file#"$rel"/}"
  fi
}

top_changelog_version() {
  # Accepts: ## 1.2.3 | ## [1.2.3] | ## v1.2.3 — skips pure ISO dates
  sed -n 's/^##[[:space:]]*//p' "$1" | while IFS= read -r line; do
    tok="${line%% *}"
    tok="${tok#[}"
    tok="${tok%]}"
    tok="${tok%,}"
    tok="${tok#v}"
    case "$tok" in
      [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*) continue ;;
      [0-9]*.[0-9]*) printf '%s\n' "$tok"; break ;;
    esac
  done
}

top_actions_version() {
  [[ -f "$1" ]] || return 0
  awk '/^[[:space:]]*#/{next} /^[[:space:]]*$/{next} {print $1; exit}' "$1"
}

if [[ ! -f "$ROOT/VERSION" ]]; then
  echo "VERSION GATE: no VERSION at $ROOT"
  exit 1
fi
if [[ ! -f "$ROOT/CHANGELOG.md" ]]; then
  echo "VERSION GATE: no CHANGELOG.md at $ROOT"
  exit 1
fi

files="$(changed_files)"
version_changed=0
changelog_changed=0
code_changed=0
code_examples=()

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  local_file="$(to_local "$file")"
  [[ "$local_file" == "VERSION" ]] && version_changed=1
  [[ "$local_file" == "CHANGELOG.md" ]] && changelog_changed=1
  if ! is_doc_or_release_file "$local_file"; then
    code_changed=1
    if (( ${#code_examples[@]} < 3 )); then
      code_examples+=("$local_file")
    fi
  fi
done <<< "$files"

current="$(sed -n '1p' "$ROOT/VERSION" | tr -d '[:space:]')"
top_version="$(top_changelog_version "$ROOT/CHANGELOG.md")"
if [[ -n "$current" && "$top_version" != "$current" ]]; then
  echo "VERSION GATE: $ROOT VERSION ${current} != top CHANGELOG ${top_version:-'(none)'}"
  (( failures++ ))
fi

if (( version_changed != changelog_changed )); then
  if (( version_changed )); then
    echo "VERSION GATE: $ROOT changed VERSION without CHANGELOG.md"
    (( failures++ ))
  else
    echo "VERSION GATE: $ROOT changed CHANGELOG.md without VERSION"
    (( failures++ ))
  fi
fi

if [[ ! -f "$ROOT/ACTIONS" ]]; then
  echo "VERSION WATCH: $ROOT missing ACTIONS — prepend \"${current:-?} tools=<n>\""
  (( warnings++ ))
elif [[ -n "$current" ]]; then
  top_actions="$(top_actions_version "$ROOT/ACTIONS")"
  if [[ "$top_actions" != "$current" ]]; then
    echo "VERSION WATCH: $ROOT VERSION ${current} != top ACTIONS ${top_actions:-'(none)'}"
    (( warnings++ ))
  fi
fi

if (( version_changed == 0 && changelog_changed == 0 && code_changed )); then
  examples="${code_examples[0]}"
  for (( i = 1; i < ${#code_examples[@]}; i++ )); do
    examples+=", ${code_examples[$i]}"
  done
  echo "VERSION WATCH: $ROOT code without VERSION/CHANGELOG (${examples})"
  (( warnings++ ))
fi

if (( failures == 0 && warnings == 0 )); then
  [[ "$MODE" == "--quiet" ]] || echo "VERSION WATCH: clean (${current}) — $ROOT"
fi

(( failures > 0 )) && exit 1
exit 0
