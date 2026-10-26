# PLAN — Take Tom Lane’s home street address off /letter

## Goal

Remove Tom Lane’s home street address from the public openpeople.ai site and keep it from coming back. Tom approved this slice.

## In

- `app/(marketing)/letter/page.tsx`: drop “281 Water Street” from the From block, the opening line, and the signature block. City/province stay.
- Intro note: the letter is unchanged except that the home street address has been removed.
- The rest of the `/letter` route (metadata, description, JSON-LD, OG/Twitter images, any PDF or text copy in `public/`).
- Repo-wide search of shipped source, data, and public files for “281 Water” and “Water Street”.
- A unit test that fails if public marketing source or rendered copy contains “Water Street”, “281 Water”, “685-8584”, “6858584”, or “auth@”.
- Lint, typecheck, build, and the test suite. `__tests__/unit/lib/email/sync.test.ts` already fails on main; leave it.

## Out

- Any other copy, design, or board work. Cursor is building the project board; do not touch it.
- Merge to `main`, force-push, or production promote. Tom merges.

## Dest

- This repo’s marketing site. Vercel project `open-people`. Production host `www.openpeople.ai`.
- Ship path: feature branch → PR → Vercel preview. Do not promote the preview.

## First slice (this PR)

Letter address removal only: the three “281 Water Street” lines on `/letter`, the intro-note exception, any other shipped copies of the address, and a regression test so it cannot return.

## Done when

- `/letter` shows no street address (From, opening, signature).
- No shipped source, data, or public file still prints “281 Water” / “Water Street”.
- The unit test passes after the fix and fails if the address is put back.
- Lint, typecheck, and build pass. The known email-sync unit failure is unchanged.
- PR is open. CI is green. Vercel preview `/letter` shows no street address.
