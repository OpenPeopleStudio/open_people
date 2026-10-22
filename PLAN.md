# PLAN — Public vision update

## Goal

Publish Open People’s latest public thesis on openpeople.ai: Newfoundland and Labrador hydro as Canada’s base for sovereign AI compute. Open People **leads** a proposed 500 MW Labrador AI campus and a research campus — proposed, in feasibility, not a built project.

## In

- Thesis: NL hydro as Canada’s base for sovereign AI compute, tied to the national grid and federal sovereign-AI goals; a big-picture proposal for power in Canada, not just one site.
- A proposed 500 MW AI data campus in Labrador (proposed / in feasibility). Open People is the **proponent leading the build**, in proposed partnership with NL Hydro, Indigenous nations (consent first), and capital. Not a signed allocation or a named customer list.
- A research campus where people from across Canada come to tackle problems society will face in the age of AI: residencies, fellowships, gatherings, in the spirit of the Perimeter Institute and the Banff Centre. Open People leads this too.
- Near-term: feasibility work on the costs and impact of the project (general terms only).
- Honest constraints: mines and existing industry are real constraints on the same power. No reserved megawatts in the public paper.
- Style: match the existing desk (fonts, colours, voice, `/brief` cadence). Use `components/marketing/voice/Dual.tsx` where it fits. Update OG/meta for any new or rewritten page.

## Out

- Any ACOA or government funding ask
- Budgets, dollar figures, capex, personal or company finances
- Named prospective customers (no SpaceX / xAI) or named capital firms
- Language that Hydro or a nation has **signed** — partnership is proposed; consent is first
- snōw white laundry, SWL, or Brendan
- Phone numbers or street addresses (contact is `tom@openpeople.ai` only)
- Any change to `/letter` text
- Invented facts or numbers
- Language that the campus is approved, funded, or under construction
- The old role: “catalyst, not a deal seat”, “not asking to own the steel”, “does not assemble bankable offtake”, “compute is leftover-firm-power optionality”, “wrong page / wrong organisation”
- Merge to `main` or production deploy (`www.openpeople.ai`). Tom says “ship it” first.

## Dest

- This repo’s marketing site. Vercel project `open-people`. Production host `www.openpeople.ai`.
- Ship path: feature branch → PR → Vercel preview. Do not promote the preview.

## First slice (landed on this PR)

Rewrite `/vision` as the public thesis page (Dual, OG, Vision in nav/footer). Tom Lane’s four sentences kept as the close.

## This slice (same PR)

Rewrite public role copy so Open People **leads** the proposed campuses.

- `/brief`, `/compute`, `/about`: kill catalyst / leftover-optionality / “wrong page” copy.
- Supporting surfaces that repeat the old role on the public site: `/`, `/approach`, footer, `/engage` meta, `lib/desk/compute.ts`, industries compute line, glossary, compute OG.
- Remove SWL from `/about` and `/brief`.
- `/letter` still untouched. `/coalition` (noindex partner brief) left for a later slice except where it inherits `COMPUTE_*` data.

## Later slices (not this PR)

- Home as a thesis front door (Churchill desk remains a door).
- Research campus as its own route.
- `/coalition` full rewrite; `/contact` Dual; CLAUDE.md current-state line.

## Done when (this slice)

- Named pages no longer say catalyst-not-steel, leftover optionality, or “wrong organisation”.
- They say Open People leads a proposed 500 MW campus and a research campus, in feasibility, with Hydro / Indigenous nations (consent first) / capital as proposed partners — not signed.
- Mines and existing industry remain named as real power constraints.
- No Out topics in files this slice edits. `/letter` unchanged.
- Tests updated. Same PR, preview only, not merged.
