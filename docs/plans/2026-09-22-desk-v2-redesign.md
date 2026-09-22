# Desk v2 — modern instrument, guided depth, verified data

**Status:** plan (not yet implemented) · **Date:** 2026-09-22 · **Scope:** the public surface of openpeople.ai (`app/(marketing)/*`, `components/marketing/*`, `lib/desk/*`, `lib/voice-mode/*`, `public/brief.html`, `public/coalition.html`).

**Goal in one line.** Make the site read as a precision instrument for the Churchill Falls / Gull Island decision: modern and near-futuristic in restraint and craft, never sci-fi; every number digestible by a voter in one breath and defensible to an energy lawyer on the same screen; and the move from plain to technical should feel *guided*, not like flipping a tab.

**Audience test.** An MHA who voted on 17 September should leave the home page with two feelings at once: *this clock is running and the public text still doesn't say who gets the power* (scare) and *this is one of the cleanest large power assets in North America and the option is still open* (excite). Every section is designed against that test.

---

## 0. What exists today (and what to keep)

The 0.4.x slices built a strong **data spine** that the redesign must not throw away:

| Keep | Why |
|---|---|
| `lib/desk/*` typed facts with `plain` / `technical` twins, `sources[]`, `lastVerified`, `status` | This is the credibility engine. Every instrument in v2 renders *from* these objects; nothing is hand-typed into JSX. |
| `DESK_SOURCES` registry with primary / regulator / utility / press / scholarship kinds | Becomes the visible provenance chip on every figure. |
| `UNKNOWN` as a first-class status | v2 makes it loud (dashed slots, a counter), not quieter. |
| `__tests__/unit/lib/desk/facts.test.ts` guards (no invented SPE, 1.8 vs 7.4 not merged, MOU path not a PPA) | Extended, never weakened. |
| `VoiceModeProvider` + `?v=` query param + `op.voiceMode` storage | Kept as the *depth preference* store; the UI on top of it changes. |
| Doctrine: mining first, compute quarantined at `/compute`, Open People is not a DCIA party | Unchanged. Design serves it. |
| Void `#040404` + plasma `#e8893c`, serif display + mono numerals | The distinctive part of the current look. Refined, not replaced. |

What is holding the site back:

1. **Plain vs Technical is a global swap.** `Dual` hides one layer and shows the other. Nothing connects the plain sentence to the number it summarises. `Receipts` is a native `<details>` that reads as a footnote. There is no "I don't get this word" affordance at all.
2. **No instruments.** Timeline, megawatts, price stories and the corridor are all prose and tables. A politician cannot *see* the clock or the gap.
3. **Shell inconsistency.** Home, `/tracker`, `/costs`, `/compute` use `desk-page`; `/industries`, `/about`, `/approach`, `/engage` use ad-hoc `pt-28 sm:pt-36`. `/brief` and `/coalition` are separate hand-written HTML files with their own CSS and duplicated numbers (1.8→11.5, 2,350 MW, 4–6¢ asks).
4. **Leftover SaaS-era chrome.** `globals.css` still ships `.noise` (fixed full-screen overlay at z-index 9999 on every page), `.glow-*`, `.bg-grid`, `text-gradient-*`, `animate-twinkle`, `animate-orbit`, `.glass-card`, rounded 0.625rem buttons next to 2px desk radius, and `--electric-*` aliases. Google Fonts `<link>` in `app/layout.tsx` is render-blocking and the display serif (Iowan Old Style) falls back to Palatino / Georgia on most machines.
5. **Internal jargon leaks.** "Horizon desk", "Hogan test", "Path C", "quarantine", "slice" appear on public pages. Domain jargon (PPA, DCIA, Annex D, take-or-pay, retain, offtake, RFIRM) appears in *plain* copy with no explainer.
6. **Status colour is misleading.** `endorsed` and `published-rate` map to `--success` green. An endorsement is not a signed contract; green says "done".
7. **Contrast.** `--text-muted` is white at 46% on near-black (≈3.9:1), used for 11px mono captions. Below AA for that size.

---

## 1. Design direction: "Instrument, not spectacle"

### 1.1 What we take from SpaceX / xAI, and what we deliberately do not

Take:

- **The black field and one accent.** Nothing decorative competes with the number.
- **Numerals as the hero.** Large tabular figures with small uppercase unit labels underneath. The figure is the image.
- **Full-bleed sections, one idea each, hairline rules.** No cards-in-cards.
- **Sharp geometry.** 0–2px radius everywhere. No pills except status chips.
- **Motion that is physical and scroll-tied.** Counters settle once; sections reveal once; nothing loops, floats, pulses or glows.
- **A thin, quiet nav.** Uppercase mono, few links.

Do not take (this is where it stops being a cookie-cutter):

- No centred hero over a photograph. Our hero is a **time instrument**, left-aligned, with a serif headline.
- Keep the **serif display face**. SpaceX/xAI are all-sans; our serif + mono pairing reads "newspaper of record + control room", which is exactly the brief.
- **Warm accent** (plasma) instead of their cold white/blue, plus a **cool steel** second tone reserved for the technical layer (see 1.3). Colour encodes depth.
- **Document texture.** Annex, section and schedule references rendered as monospaced citation badges (`DCIA §4(b)(iv)`, `Annex D · 2027`). Their sites cite nothing; ours cites everything.

Hard "not sci-fi" rules (enforced in code review): no glows, scanlines, particle fields, HUD brackets, corner ticks, glitch, neon, gradient text, animated grids, orbiting rings, radar sweeps, or typewriter effects. The existing utilities for these are deleted in Phase 1.

### 1.2 Typography

Self-host with `next/font/google` (removes the blocking `<link>` and the Palatino fallback lottery):

| Role | Face | Notes |
|---|---|---|
| Display / headlines | **Newsreader** (variable, optical sizes) | Editorial serif with real display cuts; closest open replacement for Iowan Old Style's tone. `font-optical-sizing: auto`. |
| Body | **Inter** (variable) | Already the intended body face. |
| Numerals / labels / citations | **JetBrains Mono** (variable) | Tabular numerals, distinct `0`/`O`, good at 11px. |

Scale (fluid): `--fs-hero: clamp(2.6rem, 6.5vw, 5rem)`, `--fs-num-xl: clamp(3.5rem, 9vw, 7rem)` for instrument figures, `--fs-h2: clamp(1.6rem, 2.8vw, 2.4rem)`, body 17px/1.6, captions 11–12px mono with ≥0.08em tracking. Prose measure 62ch; instruments up to 1200px.

### 1.3 Colour and depth encoding

```
--void #040404      page
--surface-1 #0a0a0a --surface-2 #101012   (hairline-separated, no shadows)
--ink #f2f4f6       --ink-2 rgba(242,244,246,.74)   --ink-3 rgba(242,244,246,.56)  (muted raised for AA)
--plasma #e8893c    PLAIN layer accent: takeaways, primary actions, "today" marker
--steel #8a9bb0     TECHNICAL layer accent: receipts, citations, term underlines, technical rails
--hairline rgba(255,255,255,.08)  --hairline-strong rgba(255,255,255,.16)
```

Status (semantic, chip = outline + text, never filled):

| Status | Treatment |
|---|---|
| `signed` | green outline (`#5fa87c`) — the only green on the site |
| `endorsed`, `framework`, `structure`, `first` | plasma outline |
| `open`, `reported` | amber (`#d4a84b`) |
| `unknown` | **dashed** red-amber outline (`#e07a5f`), label `NOT PUBLISHED` on instruments, `UNKNOWN` in text |
| `heritage`, `cited`, `secondary`, `published-rate` | steel outline |

Depth is colour-coded everywhere: warm = the human sentence; steel = the receipt. A reader learns the code in one screen and never needs a legend.

### 1.4 Layout system

- 12-column grid, 24px gutters, max 1200px for instruments and 720px for prose.
- **Left rail (≥1024px):** section index for the current page + the Depth control + "Walk me through it". Sticky. On mobile it collapses into a bottom sheet opened from a single rail button.
- Page shell: one `DeskPage` component (kicker, headline, lede, verified strip) used by *every* public route. Ad-hoc padding goes away.
- Print: light, serif body, receipts always expanded, instruments as static SVG. Politicians print.

### 1.5 Motion

- Page load: nothing animates except a 180ms fade on the hero (existing).
- Scroll: sections get a one-time 240ms rise of 8px, staggered 40ms per child, via `IntersectionObserver` + CSS class. Instruments draw once (stroke-dashoffset on paths, ≤600ms). Counters settle over ≤700ms with `ease-out`, tabular width reserved so nothing shifts.
- Interaction: unfolds use CSS `grid-template-rows: 0fr → 1fr` (no JS height measurement), 220ms.
- `prefers-reduced-motion`: everything above becomes instant. No exceptions.

---

## 2. The guided depth system (the core UX ask)

Today: two voices, one switch. v2: **three depths, five components, one rule** — the plain sentence never leaves the screen; the technical layer arrives *underneath and connected to it*.

### 2.1 Depth model

| Depth | Who | What renders |
|---|---|---|
| **Plain** (default) | Voter, journalist, busy MHA | One-breath takeaway + the figure. Technical block collapsed to a single steel hairline with a `Break it down` affordance. |
| **Guided** | Someone who wants to understand, not just know | Plain + a one-line *why it matters here* + inline term explainers for the first appearance of each term on the page. Technical block still collapsed but its first sentence is shown as a teaser. |
| **Technical** | Analyst, lawyer, Hydro staff | Everything unfolded. Citations inline as badges. Term underlines still available. |

The control is a 3-position segmented `Depth` in the rail (mobile: in the sheet), replacing the two-way nav toggle. `lib/voice-mode/parse.ts` gains `guided` (`?v=guided`); the storage key stays `op.voiceMode`; `plain` stays default so existing links and tests keep working.

### 2.2 Components

1. **`<Unfold plain technical figures>`** — replaces `Dual` and `ScaleAnchor`. Renders the plain node, then a collapsible technical node under a steel hairline. Any `<Fig id>` marks in the plain sentence (e.g. `1.8¢`, `21–18`) get a small steel tick when the technical block is open, and the matching `<Fig id>` inside the technical block highlights on hover/focus. The reader sees exactly which technical line backs which plain number. Affordance copy is contextual: `Break down 1.8¢`, not `Show more`.

2. **`<Term k="ppa">`** — wraps jargon with a dotted steel underline. Click/tap opens an inline explainer (desktop: anchored popover; mobile: bottom sheet) with three lines: *what it is*, *why it matters here*, *where it shows up* (link to the tracker row or DCIA section). Registry at `lib/desk/glossary.ts`; a unit test asserts every `k` used in pages exists and every entry has all three lines under 40 words. Initial set: DCIA, Material Terms, PPA, Definitive Agreements, framework vs binding, firm power, MW vs MWh vs TWh, ¢/kWh, mill, availability contract, take-or-pay, Annex B/D/F, CPI deadband, recapture, synthetic export, domestic load, entitlement, SPE, IAAC, PUB, LAB-IND-1, RFIRM, 230 kV / 735 kV, Innu Nation, CF(L)Co, IRC, MOU.

3. **`<Figure value unit status source lastVerified>`** — the only way a number is rendered on an instrument. Hover/focus/tap shows a provenance card: status chip, last-verified date, source label and link. `status="unknown"` renders a **dashed empty slot** with `NOT PUBLISHED`. Instruments cannot show a number that is not a `Figure`.

4. **`<Nudge>`** — the "oh, you don't understand this, let me break it down" moment, done politely. Uses `IntersectionObserver`: when a card with a collapsed technical block stays ≥60% visible for ≥4s in Plain depth, a single quiet line appears under it: *Want the receipt for 1.8¢? →*. In Technical depth, when a dense block stays visible ≥6s: *Lost in the annexes? Read it plain →*. Rules: one nudge per card per session, never more than one visible at a time, never a toast or modal, `aria-live="polite"`, off entirely under reduced motion, and a "don't nudge me" toggle in the rail persisted to storage.

5. **`<Walkthrough>`** — "Walk me through it" from the home hero and the rail. A stepper (no overlay): scrolls to each gate on the Gate Clock in turn, unfolds one explainer per step, shows `Step 2 of 5` in the rail with prev/next. Keyboard: `→`/`←`, `Esc` exits. Also offered on `/tracker` (walk the UNKNOWNs) and `/costs` (walk the price families).

`Receipts` (`<details>`) is retained only inside `Unfold` for the source list; its summary copy becomes `Sources (3)`.

### 2.3 Copy rules for the plain layer

- One sentence, ≤22 words, subject–verb–object, number last.
- Never a term without a `<Term>` on first use per page.
- The plain sentence must be *true on its own* if the technical block never opens (this is already the doctrine; the tests will check sentence length and the presence of a technical twin).
- Internal jargon is banished from public copy: "Horizon desk" → "Churchill River desk" (or just the page title); "Hogan test", "Path C", "slice", "quarantine" removed or rewritten.

---

## 3. Instruments (SVG, no chart library)

All hand-built React SVG, server-rendered, consuming `lib/desk` only. No new dependency (repo rule: dependencies need an ADR). Each instrument has a static `<title>`/`<desc>`, a text fallback table for screen readers, and a print version.

| # | Instrument | Where | Data | What it makes a politician feel |
|---|---|---|---|---|
| I1 | **Gate Clock** — horizontal time rail: 17 Aug (signed framework) · 17 Sep (House 21–18) · 5 Oct (Québec votes) · 31 Dec (binding target) · 31 Mar 2027 (term end) · mid-2030s (GI, preliminary). *Today* marker; `days to` counters under the next two gates. | Home hero (full), compact strip under the verified bar on every desk page | `HOME_GATES`, tracker rows `dcia`, `house`, `qc-gate`, `binding-window`, `gull-island` | The clock is running. |
| I2 | **Unknown Board** — one giant numeral: the count of tracker rows with `status: unknown`, then each as a dashed slot with its plain title. | Home §02, `/tracker` header | `TRACKER_ITEMS` | The public text still doesn't say. |
| I3 | **Price Ladder** — one ¢/kWh axis; each family on its own row (Heritage export · Reported HQ path · Published Labrador tariffs · Island grid · Neighbouring QC data-centre tariff · **Signed industrial ¢: NOT PUBLISHED**). Each rung is a `Figure` with chip. A labelled divider reads *different measurements — labelled, not merged*. The 1.8→11.5 reported path is a faint dashed rise, not a solid line. LAB-IND-1 renders as a formula badge, not a rung. | `/costs` hero; home §01 compact | `COST_MARKERS`, `CONTESTED_EXPORT` | 0.2¢ left the province for decades; 13¢ is what Québec charges compute; the number that would matter here is blank. |
| I4 | **Flow Bars** — proportional horizontal bars: CF 5,428 MW total; NLH allocation today ~525 MW (of which ~312 MW mining, press-cited); public retain framing up to 2,350 MW (outlined = announcement language); GI 2,250–2,700 MW (hatched = range, subject to studies); wind 2,000 MW study (+400 MW to NL *if built*). Solid = published; outlined = announced; hatched = preliminary/range; dashed = unknown. | `/industries` hero; `/tracker` extras | `INDUSTRY_CARDS`, tracker `gull-island`, `wind-spe`, `SCALE_ANCHORS.retainedMw` | Scale of the asset; how little of it is pinned down in public. |
| I5 | **Corridor Schematic** — not a map: Churchill Falls node → Labrador West (existing 230 kV, labelled *at limit*) → proposed 735 kV (~1,500 MW, *funded, no in-service date*) ; separate east line toward Québec; town nodes (HV-GB, Lab City, Wabush, CF townsite). | `/industries` | `nlhLabWest`, `govNlDcia`, `cbcMining` | Mines are first and the wire is the constraint. |
| I6 | **Annex Ramp** — preliminary schedule bands: CF upgrades ramp early 2030s → ~1,275 MW by early 2040s; GI energy mid-2030s. Everything hatched with a `PRELIMINARY · Annex B` badge. | `/tracker` (`gull-island`, `cf-upgrades` rows) | tracker rows | New megawatts are a decade out; the contracts that decide who gets them are months out. |
| I7 | **Default Path** — a two-branch diagram: *retained power used at home* vs *not used → HQ buys at 95% of PPA price (no 3-year notice)* with the §4 options as labelled branches (280 / 240 / 200 MW). | `/engage`, `/costs` §02 | tracker `unused-retain`, marker `synthetic-export` | Indecision has a buyer already named in the paper. |

Explicit non-goals: no derived numbers (no payment ÷ TWh, no NPV per MW), no forecast lines beyond what a cited document draws, no compute megawatts anywhere except the quarantined page's text.

---

## 4. Page by page

Every page: `DeskPage` shell → verified strip → compact Gate Clock → content → one primary CTA (`/engage`). Depth control and section index in the rail.

**Home `/`** — Headline stays *Keep the power here. Watch the gates.* Under it, I1 full width with the two live counters. Then three full-bleed bands: (1) *What we hold* — 43 TWh renewable, 97% of output, most exported (Figures with CER provenance); (2) *What is still blank* — I2 with the UNKNOWN slots; (3) *What the paper already decides if nobody writes it* — I7. Then the four doors (Tracker / Industries / Costs / Brief) as a hairline row, the five published rules, and the closing CTA. "Walk me through it" sits beside the primary CTA.

**`/tracker`** — I2 header (count), compact I1, then the board. Board columns stay *On paper / Open / UNKNOWN* but each row becomes `Unfold` with `Figure`-marked dates and MW; I6 appears under the Gull Island and CF Upgrades rows. A filter chip row (`All · Money · Power · People · Process`) is a stretch item.

**`/costs`** — I3 hero (the ladder is the page). Then the two-column contested card (kept, restyled) → structure (I7) → published Labrador rates (LAB-IND-1 as a formula card with `Term`s on RD/RM/RFIRM) → schedule-era note. The marker table and the marker cards merge into one list: each ladder rung scrolls to its card.

**`/industries`** — I4 hero, I5 below, then the mining-first cards as `Unfold`. Compute stays one steel-toned secondary line linking to `/compute`.

**`/engage`** — Hero + "seven checks" become a **checklist an MHA can print**: each check is a `Figure`-backed question with the tracker row it maps to and a *status today* chip. I7 sits between the checks and the doors. MHA templates and the form stay; add a *Print this page for your MHA* action (print stylesheet already planned). The doors list is kept but every dated entry gets a `Figure`-style verified stamp.

**`/compute`** — Quieter shell (existing `desk-quiet`), no instruments, no Gate Clock (it must not read as a project timeline). Remove "Hogan test" copy. Keep the honesty list.

**`/letter`** — Typographic only: Newsreader at reading size, wider leading, the four section anchors in the rail. No instruments.

**`/about` `/approach` `/contact`** — Move onto `DeskPage`; drop "Path C" from public copy (say what it means instead); nothing else.

**`/brief` and `/coalition`** — Port from static HTML into `app/(marketing)/brief/page.tsx` and `coalition/page.tsx` using the same components, so there is one design system and one data source. Remove the `rewrites()` for them in `next.config.ts`; keep `/coalition` `noindex` and out of the sitemap. The brief keeps its section structure (situation → asset → value gap → window → neighbouring grids → the ask → who builds → constraints → who we are) but every number becomes a `Figure` from `lib/desk`, which retires the duplicated 1.8→11.5, 2,350 MW and $49B / $273B strings. The 4–6¢ and 100–150 MW *asks* stay labelled as Open People asks (existing doctrine) and are rendered in a distinct "ask" style, never as `Figure`s.

**Nav** — `Tracker · Industries · Costs · Brief · Engage` + `Letter` in the footer. Depth control leaves the nav for the rail. Mobile: single menu button, sheet with links + Depth + Walkthrough.

---

## 5. Data accuracy — audit and corrections (2026-09-22)

_Filled from the two verification passes run today. See §5.1 for the verdict table, §5.2 for corrections to apply before any visual work ships, §5.3 for the standing verification process._

<!-- AUDIT-PLACEHOLDER -->

---

## 6. Implementation phases

Order matters: data first, then the system, then instruments, then pages. Nothing visual ships on top of a stale number.

### Phase 0 — Data refresh (0.5 day)
- Apply §5.2 corrections to `lib/desk/*` and `lib/voice-mode/anchors.ts`; bump `DESK_VERIFIED`.
- Add `lib/desk/glossary.ts` (empty registry + types) and `lib/desk/gates.ts` (typed gate list for I1, derived from tracker rows).
- Tests: extend `facts.test.ts` for any corrected value; add `glossary.test.ts` skeleton.
- Bump `VERSION` → 0.5.0, `CHANGELOG.md`, `ACTIONS`.

### Phase 1 — Design system v2 (1.5 days)
- `next/font` for Newsreader, Inter, JetBrains Mono; remove the Google Fonts `<link>` from `app/layout.tsx`.
- New `app/(marketing)/desk.css` imported from `app/(marketing)/layout.tsx`: tokens in §1.3, type scale in §1.2, `DeskPage` shell classes, status chips, instrument styles, print sheet. The public pages stop depending on the SaaS-era utilities in `app/globals.css` (`.noise`, `.glow-*`, `.bg-grid`, `text-gradient-*`, `.glass-card`, `.feature-card`, `animate-float/twinkle/orbit/pulse-glow`, `--electric-*`). Those utilities are used in ~130 platform and super-admin files, so they stay in `globals.css` untouched; the marketing layout simply does not render the `.noise` overlay (move that `<div>` from `app/layout.tsx` into the platform and super-admin layouts) and the `desk-*` rules move out of `globals.css` into `desk.css`.
- New `components/marketing/shell/`: `DeskPage`, `Rail`, `DepthControl`, `MobileSheet`. `SiteNav` slimmed per §4.
- Acceptance: every public route renders on `DeskPage`; Lighthouse a11y ≥ 95; no console warnings; contrast ≥ 4.5:1 for all text ≤ 14px.

### Phase 2 — Guided depth system (2.5 days)
- `lib/voice-mode/parse.ts`: add `guided`; keep `plain` default; update `provider.test.tsx` and `parse.test.ts`.
- `components/marketing/depth/`: `Unfold`, `Fig`, `Term`, `TermSheet`, `Figure`, `Nudge`, `Walkthrough`, `useDepth`. `Dual` and `ScaleAnchor` become thin wrappers over `Unfold` for one release, then are removed.
- Populate `glossary.ts` (≈30 entries) with the three-line format; test enforces coverage and length.
- Acceptance: keyboard-only walkthrough of home and `/costs`; screen-reader pass (VoiceOver + NVDA) on `Term` and `Unfold`; nudges never stack; reduced-motion audit.

### Phase 3 — Instruments (3 days)
- `components/marketing/instruments/`: `GateClock`, `UnknownBoard`, `PriceLadder`, `FlowBars`, `CorridorSchematic`, `AnnexRamp`, `DefaultPath`. Pure SVG, props typed to `lib/desk` shapes, `Figure` for every number, `<title>`/`<desc>` + visually-hidden table.
- `GateClock` day math is a pure function (`daysUntil(gate, today)`) with unit tests at fixed dates, including after a gate passes (it must flip to *passed* and never go negative).
- Acceptance: each instrument has a Storybook-free fixture page under `app/(marketing)/_fixtures/` (dev only) and a Playwright screenshot at 360 / 768 / 1280.

### Phase 4 — Pages (4 days)
- Rebuild in this order: home → `/tracker` → `/costs` → `/industries` → `/engage` → `/compute` → `/letter` → `/about`, `/approach`, `/contact`.
- Copy pass on every plain sentence against §2.3 (length, term coverage, no internal jargon).
- OG images (`opengraph-image.tsx`) regenerated to the new type; `/letter` already has one to mirror.

### Phase 5 — Brief and coalition port (2 days)
- Port `public/brief.html` → `app/(marketing)/brief/page.tsx`; same for coalition. Delete the static files and the two rewrites. Confirm `/brief` still 200s at the same URL and `/coalition` still carries `noindex` and is absent from `app/sitemap.ts`.
- Diff every number in the old HTML against the `Figure` that replaces it; anything that has no home in `lib/desk` either gets one (with a source) or is cut.

### Phase 6 — QA and launch (1.5 days)
- Playwright: depth switch persists across navigation and `?v=`; `Unfold` opens/closes; `Term` popover and sheet; walkthrough steps; print media emulation snapshot of `/engage`.
- Performance: LCP < 1.8s on 4G for home; zero CLS from counters (width reserved); JS for a static page ≤ 90 kB gz (only depth components are client islands).
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` green.
- Version trio bump; release note in `CHANGELOG.md`.

Total ≈ 15 working days for one engineer; Phases 2 and 3 can run in parallel with two.

---

## 7. Guardrails (unchanged doctrine, now enforced by the system)

- No number reaches a page except through a `Figure` bound to a `lib/desk` object with `sources[]` and `lastVerified`.
- `UNKNOWN` is rendered, counted and never hidden behind a collapsed block.
- No derived figures (no payment ÷ TWh, no ¢ bridges, no compute MW).
- 1.8 start and 7.4 average stay labelled and apart; the ladder places them on separate rungs in the same family with the *different measurements* divider.
- Compute never appears on an instrument. `/compute` gets no Gate Clock.
- New dependencies require an ADR under `decisions/`. This plan needs none.
- "Hogan-calm": scare comes from dates and blanks, never from adjectives.

---

## 8. Decisions needed before Phase 1

1. **Fonts.** Newsreader / Inter / JetBrains Mono as proposed, or a licensed alternative for the display face (e.g. a commercial Iowan-class serif)? The proposal is fully open-licence and needs no purchase.
2. **Photography.** The direction works without imagery. If a single monochrome Churchill Falls / Labrador West photograph is wanted for the brief, it must be licensed or commissioned; NL Hydro press imagery is not assumed usable.
3. **Light theme.** Not in this pass (print is light). Confirm.
4. **MHA vote roll by name.** The 21–18 roll is public but must be transcribed from Hansard, not press. Proposed as a Phase 4 stretch on `/tracker`; confirm whether it is wanted at all.
5. **Filter chips on `/tracker`** and the **`/engage` printable checklist** — both are stretch; confirm priority.
6. **Port `/brief` and `/coalition`** (Phase 5) versus reskinning the static HTML. The port is recommended so numbers have one source.

---

## 9. Acceptance test (the "politician test")

Run with a real MHA staffer if possible, otherwise with two lay readers and one energy analyst:

1. Home, 30 seconds, no scrolling past the hero: can they say what happens on 31 December and how many days away it is?
2. `/costs`, plain depth: can they explain in their own words why 1.8¢ and 7.4¢ are not a contradiction? Then open one `Term` and one `Unfold` unprompted.
3. `/tracker`: can they name two things the public text does not say?
4. Analyst on technical depth: can they reach the DCIA section reference for the 95% discounted PPA price in under three clicks?
5. Print `/engage` from Safari and Chrome: is the checklist legible with sources?

If any of 1–3 fails with lay readers, the plain copy is wrong, not the reader.
