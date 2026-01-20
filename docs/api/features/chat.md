# Chat API

Chat is implemented under `app/api/chat/**` and powers:

- conversations + messages
- “memories” (saved context)
- “actions” (turn a chat message into a note, fact, edit, etc.)

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

