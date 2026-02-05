# Lock Policy

Owner: Coder

Purpose: enable parallel work without overlapping diffs or surprise conflicts.

## Lock Types

- `exclusive`: Only the owner edits the listed scope.
- `shared`: Multiple owners can edit, but only if they agree up front and list all owners.
- `intent`: A short-lived claim to signal upcoming edits (no edits yet). Convert to `exclusive` before changing files.

## Scope Rules

- Lock the smallest scope that reasonably covers your change.
- Prefer file-level locks over directory-level locks.
- If you must lock a directory or glob (e.g., `lib/auth/*`), add a short note explaining why.

## Expiry + Refresh

- Default expiry is 24 hours.
- Refresh daily by extending the `Expires` date if work is still in progress.
- Locks older than 48 hours without refresh can be cleared by another agent, but add a note in the lock row describing why it was cleared.

## Claiming a Lock

Add a row to `docs/company/locks.md` with:

- Owner (agent name)
- Date (YYYY-MM-DD)
- Scope (file list or directory/glob)
- Type (`exclusive`, `shared`, `intent`)
- Expires (YYYY-MM-DD)
- Status (`active`, `waiting`, `blocked`)
- Notes (optional)

## Conflict Resolution

- If a lock is active, choose a different scope or wait.
- For urgent fixes, ping the lock owner and add `waiting` status to your row.
- If a lock appears stale, clear it with a note and proceed only after a second check.

## Shared Lock Workflow

Use shared locks when multiple agents will edit the same file(s) or directory.

1) The owner who proposes shared work creates the lock row with type `shared`.
2) Add all co-owners in the `Owner` column using a comma-separated list.
3) Keep scope as narrow as possible; list the exact files when feasible.
4) If work splits into independent files, replace the shared lock with separate exclusive locks.
5) If any co-owner finishes early, remove their name from the shared lock row.

## Release

- Remove your lock row immediately after merge or abandonment.
- If abandoned, add a short note in the PR or task log explaining the change in plan.
