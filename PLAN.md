# PLAN — Home and nav: company and campus share the lead

## Goal

Rework the openpeople.ai home page and primary nav so Open People (the AI company) and the proposed Labrador AI campus share the lead equally. Churchill Falls drops to background context: a supporting section lower down, with links into the power record. Tom Lane’s direction: the live site looks great, but it is still 100% Churchill Falls based.

## In

- Home (`/`) and primary nav only, plus home OG/meta that describe the front door.
- Equal lead: company story (reuse `/about` and `/approach`) and the proposed campus (canonical line with “AI”).
- Canonical campus line: “Open People leads a proposed 500 MW Labrador AI campus on that power, in feasibility.”
- Power line: “The campus is proposed and in feasibility. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved.”
- Consent: “Partnership, if any, will be on terms each nation sets.” No nation named as a partner. No “No nation has been contacted” on home.
- ISED: “ISED lists Indigenous participation as one of its criteria. Any role is for each nation to decide.”
- Ottawa heading, if present: “Ottawa is looking for projects like this” (not “already paying”). Do not blend ISED’s 100 MW-plus data-centre call (15 Jan–15 Feb 2026, now closed, non-binding MOU) with the C$2B Canadian Sovereign AI Compute Strategy. Cut “a structure federal programs reward”. Cite official ISED / Canada.ca URLs; leave out anything not confirmed.
- Brand book: paper #f3f3ef, ink #0e1014, orange #f2501f, orange text on paper #c23a12; Schibsted Grotesk + DM Mono; 8px buttons; sentence case; short plain sentences. No glows, no gradients. No conquest language, no hype. Keep the existing void desk chrome; do not restyle the board pages.
- Figures and claims already on the site, with citations. No new invented numbers. Firm power is never promised. Nothing proposed stated as done.
- snōw white laundry may appear only from facts already on the site, or a plain line marked NEEDS TOM'S OK. Never mention Brendan or Verafin. Keep the home address out.

## Out

- `/brief` (PR #25). Match its consent wording; do not edit that file.
- `components/marketing/SiteFooter.tsx` (another PR is adding social links there).
- Board track pages `/power` `/capital` `/build` `/consent` beyond nav links.
- `/letter` text. `/coalition`. Parked SaaS routes.
- Merge to `main`, force-push, or production promote. Tom merges.
- NL Hydro or a nation as a “proposed partner” on home/nav.
- “stakeholders”. Any NunatuKavut-standing line. Unsourced “no nation has been contacted”.
- Invented figures, conquest/hype, glows, gradients.

## Dest

- This repo’s marketing site. Vercel project `open-people`. Production host `www.openpeople.ai`.
- Ship path: feature branch → PR → Vercel preview. Do not promote the preview.

## First slice (this PR)

Home + nav rework only, including the Ottawa / ISED wording that appears on home.

Google's SERP still shows the leftover lime-blob favicon and a Churchill Falls title because production HTML still points at `/favicon.svg` / `/favicon.ico` first. This slice also puts a never-crawled 48×48 PNG (`/brand/op-icon-48.png`) first in the icon list and updates the document title via `HOME_TITLE`. Artwork is unchanged (horizon mark). Do not promote production.

## Done when

- Above the fold names the company and the proposed campus with equal weight. Churchill Falls is not the opener.
- Nav offers a company door (`/about`) beside the four tracks.
- Home uses the canonical campus line, the Phase 1 power line, the consent sentence, and the ISED criteria sentence. Ottawa, if present, uses the looking-for heading and keeps the two federal programmes separate, with official citations.
- No Out topics on files this slice edits. Lint and build pass. Preview screenshots (desktop and mobile, above the fold). Tom Lane merges.
