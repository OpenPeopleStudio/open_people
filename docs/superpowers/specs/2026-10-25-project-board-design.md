# Open People public project board

**Date:** 2026-10-25
**Status:** Approved in conversation, pending Tom’s review of this file
**Site:** openpeople.ai (`open_people` marketing app)

## Problem

The public site is the Churchill River desk. The nav is Tracker, Industries, Costs, Brief, Vision, and Letter, and the action is “Keep power here.” A visitor meets evidence about a power agreement Open People is not a party to. The campus sits behind that as a proposal.

Open People is the project company for a proposed Labrador campus. The site should show that company operating the project. The outcome this is aimed at is the campus becoming the obvious use of firm in-province power, because the project is being run in public.

## Decisions

- Open People is the project company. The site shows the campus being made. The desk becomes the power record.
- The work is one board of four equal tracks: Build, Capital, Consent, and Power. No track leads.
- One public front door serves people in Newfoundland and Labrador, partners and capital, and people who might work on it. Depth can change. There is no second front door.
- The board publishes only what is already true and what Tom has cleared for the public record. Real figures and named parties can appear. Nothing is invented, and nothing reads as signed when it is not.
- Success: a visitor can name the company, enter a track, and see the board change when the work changes.

## Site

Three layers. Existing record URLs stay.

### Company

Home is Open People, the company building the Labrador campus: the 500 MW AI campus and the research campus.

- Kicker: `Open People`
- Title: `Building a Labrador campus.`
- Lede, plain, the sentence already public on `/compute`: “Open People leads a proposed 500 MW AI data campus in Labrador, and a research campus beside it. It is proposed, and it is in feasibility. It is not approved, not funded, and not under construction. Mines and existing industry are real constraints on the same power.”
- Lede, technical: the matching technical sentence already in `COMPUTE_HERO`.
- Under the lede: four track rows, then the log.

`/about` holds the company. It renders, in this order:

1. Who Open People is, Tom Lane, and `tom@openpeople.ai`. The current about stance stays: proponent, proposed partners as categories, consent first, not a party to the Churchill Falls agreement.
2. The vision thesis and the near-term feasibility section, still sourced from `lib/marketing/vision.ts`. The campus status is not repeated here; it is the home lede and the build seed. The research-campus section is not repeated here; it is on `/build`.
3. How we work: the five sections now on `/approach` (capital model, evidence before narrative, what we will not do, hospitality and compliance, geography), rendered from `lib/marketing/approach.ts`. The approach lede’s sentence “The Churchill River desk is the public evidence on the power.” becomes “The power record is the public evidence on the power.”
4. Tom Lane’s four vision sentences, verbatim, as the close.

`/about` links to `/build`, `/capital`, `/consent`, and `/power`.

### Tracks

Primary nav, in this order: Build, Capital, Consent, Power. The brand reads `Open People`. There is no nav campaign button.

One template, four routes:

| Route | Job | Records |
| --- | --- | --- |
| `/build` | The campus and the research campus. | `/compute` |
| `/capital` | The money for the project. | none until a record page exists |
| `/consent` | Indigenous partnership. | none until a record page exists |
| `/power` | Power for the campus. | `/tracker`, `/industries`, `/costs`, `/brief`, `/letter`, `/engage` |

Each track page:

- Title is the job.
- Top is the newest entry, plain and technical, with its cleared date and its label.
- Then that track’s log.
- Then links to its records.
- `/build` also renders the research-campus section now in `VISION_SECTIONS` (`id: "research"`): residencies, fellowships, gatherings, with Perimeter Institute and the Banff Centre named as spirit.
- The page ends with **Work this track** and the printed address `tom@openpeople.ai`.

### Records

Tracker, industries, costs, brief, letter, engage, and compute stay on their URLs and keep their current behaviour, including the gate clock and the other instruments on the power record. They leave the primary nav. The footer lists them under the track they belong to.

`/ask` and `/contact` stay. `/contact` points at the four tracks as the way to come in on the work. `/ask` stays the place to ask about the public record.

`/vision` and `/approach` permanently redirect to `/about` from `next.config.ts`. Their page files are removed. Copy they still own lives in `lib/marketing/vision.ts` and in the how-we-work module `/about` renders.

`/coalition` stays on its URL, unlisted and noindex. The nav, the footer, and the home page do not link to it. A fact from it reaches the public site only as a new cleared entry.

### Footer

The footer brand reads `Open People`. The short paragraph says Open People is building a proposed 500 MW Labrador campus and a research campus, in feasibility, and that mines and existing industry are real constraints. The desk “last verified” line stays, sourced from `DESK_VERIFIED`.

Link groups:

- Company: About, Ask, Contact
- Tracks: Build, Capital, Consent, Power
- Build record: Compute plan
- Power record: Tracker, Industries, Costs, Brief, Letter, Engage

### Share card

Home only. Record-page cards stay as they are.

- `HOME_TITLE`: `Open People — Building a Labrador campus`
- `HOME_DESCRIPTION`: the plain lede above
- Home OG card: kicker `OPEN PEOPLE`, kicker accent `LABRADOR CAMPUS`, headline `Building a Labrador campus.`, accent `Proposed. In feasibility.`, footer `OPENPEOPLE.AI`
- Alt: `Open People — building a proposed Labrador campus, in feasibility.`

Each track route gets a card in the same `DESK_OG` map. Kicker is the track name. Headline is the job. Accent is `Proposed. In feasibility.` Footer is `openpeople.ai` plus the route.

## Board module

Lives at `lib/board/`. `tracks.ts` holds the four tracks. `entries.ts` holds `BOARD_ENTRIES`. `index.ts` holds the selectors. Pages read the selectors. A public change is an edit to `entries.ts` that ships with the site. There is no publishing app, no accounts, and no review queue.

### Types

- `TrackId`: `build` | `capital` | `consent` | `power`
- `EntryKind`: `company` | `external`
- `BoardEntry`: `id`, `track`, `cleared` (`YYYY-MM-DD`), `plain`, `technical`, `kind`, `sources` (`DeskSourceId[]`)
- `Track`: `id`, `job`, `records` (`{ href, label }[]`)

Selectors take the entry list as an argument and default to `BOARD_ENTRIES`. Pages call them with no argument.

- `statusFor(track, entries?)` returns that track’s newest entry, or `null` when that track has no entries.
- `entriesFor(track, entries?)` returns that track’s entries, newest first.
- `allEntries(entries?)` returns every entry, newest first.

A `company` entry may pass an empty `sources` array. An `external` entry may not.

### Order

Sort by `cleared` descending. Within one date, the entry later in the source file is the newer one: it appears above the earlier entry, and it is the track’s status when it is that track’s latest. Home track rows ignore this order and always render Build, Capital, Consent, Power.

### Kinds

A `company` entry is Open People speaking about its own work. The page labels it `Open People`.

An `external` entry states a figure or names another party. It cites one or more ids already in `DESK_SOURCES`, added in the same change when the source is new. The page labels it with those source names. A source with no URL still shows its label. An `external` entry with an empty `sources` array fails the unit test. Both `plain` and `technical` are required on every entry.

### Seeds

The first version ships four `company` entries, one per track, each with `cleared: "2026-10-14"`. That date is the literal public date of `DESK_VERIFIED` when this spec was written. Later bumps of `DESK_VERIFIED` do not move these dates. A new clearance is a new entry.

File order, top to bottom: Build, Capital, Consent, Power. On launch day the log therefore reads Power, Consent, Capital, Build, and the rows above the log stay in track order.

**Build.** Plain and technical text are `COMPUTE_HERO`, including proposed, in feasibility, not approved, not funded, and not under construction.

**Capital.** Plain: “Capital is a proposed partner. No funder is named. Nothing is signed.” Technical: “Partnership category: capital. That is a proposed structure, not a named funder and not a signed commitment.”

**Consent.** Plain: “Indigenous partnership comes first. No agreement is claimed.” Technical: “Proposed partners include Indigenous nations, consent first. No impact-benefit agreement is signed. No meeting is claimed on this track.”

**Power.** Plain: “Open People is not a party to the Churchill Falls agreement. We lead the proposed campus, in feasibility. Mines and existing industry are real constraints on the same power.” Technical: “Open People is the proponent of the campus and is not a party to the Churchill Falls / Gull Island framework. No allocation is signed. Mines and existing industry remain real constraints on Labrador firm power.”

Seed text stays inside the current vision bans: no ACOA, no dollar amounts, no named customers, and none of the names `vision.test.ts` already rejects (`SpaceX`, `xAI`, `Brendan`, snow white, `SWL`, `Water Street`, a phone number, `281`).

### Corrections

A material change is a new entry. The status becomes that entry. The older entry stays in the log with its original `cleared` date. A typo in a sentence or a source may be edited in place, and `cleared` stays.

### Empty track

`statusFor` returns `null`. The row and the page show the track name, the job, the line “Nothing public has been cleared onto this track.”, and **Work this track.** They do not copy another track’s entry or a desk fact into the status. The shipped log is not empty. The unit test covers `null` by passing a fixture list into the selector.

## Entry

**Work this track** is a `mailto:tom@openpeople.ai` link. The subject is `Open People — Build`, `Open People — Capital`, `Open People — Consent`, or `Open People — Power`. The body is three lines:

```
Who you are:

What you are offering or asking:

Track: Build
```

The track name in the body matches the subject. The same link sits on the home row and on the track page. The address is also printed as text on the track page.

`/engage` stays the MHA tool inside the power record. `/ask` stays for questions. `/contact` stays the unscoped letter.

## Home and track layout

Both use the existing `DeskPage` shell. The home hero is the board. The home walkthrough is removed. One component, `components/marketing/board/TrackView.tsx`, renders a track. Four page files render it: `app/(marketing)/build/page.tsx`, `capital/page.tsx`, `consent/page.tsx`, and `power/page.tsx`.

Plain and technical stay a pair, shown with the existing Dual or Unfold control. That reading-depth control is on the home page and on each track page. A home row shows the plain sentence. Technical text opens through the depth control.

The gate clock stays on the power record.

## Failure and honesty

- A company entry is labelled `Open People`. An external entry is labelled with its source names.
- The build seed is the build row’s status, so the home title sits next to “not approved, not funded, not under construction.”
- Record URLs do not redirect.
- `/coalition` remains reachable by its URL and stays noindex.
- `/ask` and `/engage` keep their current behaviour.

## Tests

Desk checks on `/tracker`, `/costs`, `/industries`, `/brief`, and `/engage` stay.

### Board unit tests

New file `__tests__/unit/lib/board/board.test.ts`.

- Four tracks exist, in order Build, Capital, Consent, Power.
- `statusFor` is the newest entry. An empty log returns `null` and does not borrow.
- `allEntries` sorts by `cleared` descending, and within a date the later file entry comes first.
- Every external entry has at least one source. Every entry has plain and technical text.
- The build seed contains proposed, in feasibility, not approved, not funded, and not under construction.
- Seed entries carry none of the banned strings listed above.

### Copy tests

`PUBLIC_ROLE_FILES` in `role-copy.test.ts` gains `lib/board/entries.ts`, `lib/marketing/approach.ts`, `app/(marketing)/page.tsx`, `app/(marketing)/build/page.tsx`, `app/(marketing)/capital/page.tsx`, `app/(marketing)/consent/page.tsx`, `app/(marketing)/power/page.tsx`, and `app/(marketing)/about/page.tsx`. It drops `vision/page.tsx` and `approach/page.tsx` once those files are removed. The catalyst bans stay.

`vision.test.ts` still asserts the four sentences verbatim and the thesis bans. The e2e that used to open `/vision` asserts the sentences, Tom Lane, and `tom@openpeople.ai` on `/about`.

Home title and the home share card match the strings in this spec. Update `desk-og.test.ts` and `search-head.test.ts` where they lock the old home card.

### Browser tests

`__tests__/e2e/desk.spec.ts`:

- `/`, `/build`, `/capital`, `/consent`, and `/power` render in `main.desk-page` with an `h1`.
- Home shows the four jobs and four **Work this track** links with the four subjects.
- Visiting `/vision` and `/approach` ends on `/about`.
- Primary nav links are the four tracks. `/coalition` is absent from the nav, the footer, and the home page.
- The five-step home walkthrough test is removed.
- Depth, figure provenance, and the tracker unknown-board tests stay on the record pages.

## Out of scope

- A CMS, an inbox, or a draft queue.
- Rewriting tracker, costs, industries, brief, letter, engage, or ask.
- Merging `/coalition` onto the board.
- Publishing new figures, named funders, or named nations. Those wait for a future external entry.
- The parked SaaS admin on `app.openpeople.ai`.

## Done when

A first-time visitor on `/` can say that Open People is building a Labrador campus, see four tracks with a cleared status, enter one by mail without opening the brief, and find the Churchill Falls record only by going into Power. Shipping a new public fact means adding one `BoardEntry` and deploying.
