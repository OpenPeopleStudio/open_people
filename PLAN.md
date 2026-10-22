# PLAN — Public vision update

## Goal

Publish Open People’s latest public thesis on openpeople.ai: Newfoundland and Labrador hydro as Canada’s base for sovereign AI compute, plus a proposed Labrador campus and a national research campus — as vision, not as a built project.

## In

- Thesis: NL hydro as Canada’s base for sovereign AI compute, tied to the national grid and federal sovereign-AI goals; a big-picture proposal for power in Canada, not just one site.
- A proposed 500 MW AI data campus in Labrador (proposed / in feasibility).
- A research campus where people from across Canada come to tackle problems society will face in the age of AI: residencies, fellowships, gatherings, in the spirit of the Perimeter Institute and the Banff Centre.
- Near-term: feasibility work on the costs and impact of the project (general terms only).
- Style: match the existing desk (fonts, colours, voice, `/brief` cadence). Use `components/marketing/voice/Dual.tsx` where it fits. Update OG/meta for any new or rewritten page.

## Out

- Any ACOA or government funding ask
- Budgets, dollar figures, capex, personal or company finances
- Named prospective customers (no SpaceX / xAI), partners, or commitments
- snōw white laundry, SWL, or Brendan
- Phone numbers or street addresses (contact is `tom@openpeople.ai` only)
- Any change to `/letter` text
- Invented facts or numbers
- Language that the campus is approved, funded, or under construction
- Merge to `main` or production deploy (`www.openpeople.ai`). Tom says “ship it” first.

## Dest

- This repo’s marketing site. Vercel project `open-people`. Production host `www.openpeople.ai`.
- Ship path: feature branch → PR → Vercel preview. Do not promote the preview.

## First slice (this PR)

Rewrite `/vision` as the public thesis page.

- Keep the existing route (no new URL).
- Dual (Plain / Technical) via `Dual.tsx`; turn on desk reading-depth chrome (`singleVoice` off).
- Cover all four **In** points. Label 500 MW as an Open People proposal, not a reserved or published block.
- Keep Tom Lane’s four-sentence statement as a close, not as the whole page.
- Update `/vision` title, description, and OG/Twitter image.
- Add Vision to primary nav and footer so the thesis is findable. Do not rewrite home, brief, compute, about, contact, approach, or letter.
- Tests: copy invariants (in-scope claims present; forbidden topics absent); e2e depth chrome on `/vision`.

## Later slices (not this PR)

2. Home + brand: thesis as a front door; Churchill River desk remains a door, not deleted.
3. `/compute`: proposed 500 MW campus in feasibility language (still not a landing for a build).
4. Research campus as its own page or a deeper section.
5. `/about`, `/contact`, `/approach`, `/brief` bio: remove SWL / address / forbidden topics; Dual where it fits.

## Done when (this slice)

- This file exists with Goal / In / Out / Dest / First slice / Done when.
- `/vision` states the thesis, 500 MW proposal, research campus, and near-term feasibility, in Dual.
- Status language is only proposed / in feasibility — never approved, funded, or under construction.
- Files this slice edits contain no Out topics.
- `/letter` is untouched.
- Unit tests (and e2e assertions for `/vision`) match the new copy.
- PR is open with a Vercel preview URL. Not merged. Not deployed to production.
