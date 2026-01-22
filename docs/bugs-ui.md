# UI / UX Bug Triage

Owner: Lisa

| ID | Title | Severity | Tenant Impact | Owner | Status | Suspected Area | Evidence | Fix Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UI-001 | Icon-only controls missing accessible labels in Email UI | Medium | All tenants | Lisa | Closed | Email workspace | `components/email/EmailWorkspace.tsx`, `components/email/MessageDetailPanel.tsx`, `components/email/ComposeModal.tsx`, `components/email/InboxView.tsx` | Fixed |
| UI-002 | Super-admin vault browse TS errors | High | Super Admin | Lisa | Fixed | Vault browse UI | `app/super-admin/vault/browse/*`, `app/super-admin/vault/components/VaultDashboard.tsx` | Typecheck green 2026-01-22 |
| UI-003 | Email workspace UI TS errors | Medium | Admin UI | Lisa | Fixed | Email components | `components/email/*` | Typecheck green 2026-01-22 |
| UI-004 | Navigation + notifications missing return paths | Medium | Admin UI | Lisa | Fixed | Navigation/notifications | `components/navigation/SidebarNav.tsx`, `components/notifications/NotificationTray.tsx` | Typecheck green 2026-01-22 |
| UI-005 | Notes sharing + filters TS errors | Medium | Admin UI | Lisa | Fixed | Notes | `components/notes/NoteSharing.tsx`, `components/workspace/notes/NotesListView.tsx` | Typecheck green 2026-01-22 |
| UI-006 | ErrorBoundary optional types mismatch | Medium | App UI | Lisa | Fixed | Error boundary | `components/ErrorBoundary.tsx` | Typecheck green 2026-01-22 |
| UI-007 | Drift baseline status unused type | Low | Admin UI | Lisa | Fixed | Drift baseline UI | `components/ai/drift/BaselineStatus.tsx` | Typecheck green 2026-01-22 |
| UI-008 | Vault context unused computeHash | Low | Admin UI | Lisa | Fixed | Vault context | `context/VaultContext.tsx` | Typecheck green 2026-01-22 |
| UI-009 | Lint error: email campaigns loader functions used before declaration | High | Super Admin | Lisa | Triage | Email campaigns UI | `components/super-admin/email-campaigns/CampaignsClient.tsx` | `npm run lint` fails 2026-01-22 with `react-hooks/immutability` errors |
