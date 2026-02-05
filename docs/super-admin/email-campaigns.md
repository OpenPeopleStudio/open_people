# Super Admin: Email Campaign Drafts

This flow keeps outreach in **draft-only** mode so nothing is sent until you explicitly open a draft in the composer and click send.

## What it does
- Curate AI companies with tags, notes, and contact emails.
- Build or AI-suggest groups (e.g., “friendly pricing”, “research labs”) and attach companies.
- Draft campaign content with quick modes (thoughtful, meme, discount ask).
- Review recipients, save a campaign draft, and optionally open it in the email composer to send manually.

## Workflow
1. Go to `Super Admin → Email → Campaign drafts` (shortcut button in the Email header).
2. Add companies (name + contact email recommended).
3. Create or AI-suggest groups, then select companies or a group to target.
4. Pick a message mode and edit subject/body. This only saves a draft.
5. Save the draft – recipients are stored in `email_campaign_recipients`, and content stays in `email_campaigns` with status `draft`.
6. When ready, click “Open in composer” on a draft to prefill the email composer. Sending still goes through `/api/email/send` and requires a valid account.

## Safety
- API endpoints are super-admin only and lock status to `draft`.
- No automated sends; composer handoff is manual.
- Recipients are deduped by email; missing contact emails are skipped.
