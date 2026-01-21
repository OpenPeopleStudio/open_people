# Chat API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

Chat is implemented under `app/api/chat/**` and powers:

- conversations + messages
- “memories” (saved context)
- “actions” (turn a chat message into a note, fact, edit, etc.)

## Who should use it
- Product surfaces that need conversational UI backed by server-side reasoning.
- Automations that file notes/facts via chat actions rather than direct table writes.
- Teams experimenting with assistant behavior while keeping state server-owned.

## Why it exists
- Provide a unified conversation model (messages, memories, actions) shared by web/app.
- Keep LLM prompts, context assembly, and action execution on the server for safety.
- Enable structured side-effects (notes, facts) without duplicating logic in clients.

## Risks & responsibilities
- Messages may include PII; ensure callers are authenticated to the correct tenant.
- Actions can mutate data (notes/facts); confirm role/permission middleware is applied.
- Long-running assistant calls can be expensive; set client timeouts and retry carefully.

## Quick start
1) Auth via Supabase cookies (browser) or bearer token (external).
2) Create a conversation with `POST /api/chat/conversations`, then append messages via `POST /api/chat/conversations/:conversationId/messages`.
3) Read context with `GET /api/chat/context` and memories with `GET /api/chat/memories`.
4) Use action endpoints (`/actions/note|fact|edit`) to turn replies into structured records.

## Conversations

### GET `/api/chat/conversations`

List conversations for the current user/tenant.

### POST `/api/chat/conversations`

Create a conversation.

### GET `/api/chat/conversations/:conversationId`

Fetch conversation metadata.

### DELETE `/api/chat/conversations/:conversationId`

Delete a conversation.

## Messages

### GET `/api/chat/conversations/:conversationId/messages`

List messages in a conversation.

### POST `/api/chat/conversations/:conversationId/messages`

Append a new message and generate an assistant response (if enabled).

## Context + memories

### GET `/api/chat/context`

Fetch “project context” used by the assistant (notes, facts, goals, etc.).

### GET `/api/chat/memories`

List saved memories.

### POST `/api/chat/memories`

Create a memory.

### PATCH/DELETE `/api/chat/memories/:memoryId`

Update/delete a memory.

## Actions

Chat actions are small, explicit endpoints that turn a chat response into structured artifacts.

- `POST /api/chat/actions/note` - create a note from the conversation
- `POST /api/chat/actions/fact` - create a knowledge fact
- `POST /api/chat/actions/edit` - apply an edit action (for example, update a note)

---

**Last Updated**: January 20, 2026
