import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import { Dual, ScaleAnchor, VoiceToggle } from "@/components/marketing/voice";
import {
  ENGAGE_BINDING_PAPER,
  ENGAGE_CHECKS,
  ENGAGE_HERO_LEDE,
  ENGAGE_QUEBEC_GATE,
  SCALE_ANCHORS,
} from "@/lib/voice-mode";
import EngageForm from "./EngageForm";
import MhaTemplates from "./MhaTemplates";
import ShareEngage from "./ShareEngage";

export const metadata: Metadata = {
  title: "Keep firm power in NL",
  description:
    "The Churchill Falls / Gull Island DCIA is a framework, not binding contracts. Keep firm power in Newfoundland and Labrador for industry — mining first. Compute is a named use, not a reserved block.",
  alternates: { canonical: "/engage" },
  openGraph: {
    title: "Keep firm power in NL",
    description:
      "House endorsement is not a contract. Keep Churchill Falls / Gull Island firm power in-province — mines and Labrador industry first.",
    url: "/engage",
    type: "website",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Keep firm power in NL",
    description:
      "House endorsement is not a contract. Keep Churchill Falls / Gull Island firm power in-province — mines and Labrador industry first.",
  },
};

const OPEN = [
  ENGAGE_BINDING_PAPER,
  ENGAGE_QUEBEC_GATE,
  {
    title: "In-province use is still optional",
    technical: SCALE_ANCHORS.retainedMwEngage.technical,
    plain: SCALE_ANCHORS.retainedMwEngage.plain,
    source: SCALE_ANCHORS.retainedMwEngage.source,
  },
  {
    title: "Recall language is still open",
    technical:
      "Jason Chee-Aloy of Power Advisory told the House a three-year notice recall could let NL keep more power at home. That is testimony. It is not confirmed in signed contract text.",
  },
  {
    title: "Innu Nation partnership is unresolved",
    technical:
      "Innu Nation urged MHAs not to vote. The Premier said he will meet. Royalty and Gull Island tariff path remain unsettled. Nothing large in Labrador proceeds without that work.",
  },
  {
    title: "Federal environmental assessment is a live gap",
    technical: SCALE_ANCHORS.federalAssessmentEngage.technical,
    plain: SCALE_ANCHORS.federalAssessmentEngage.plain,
    source: SCALE_ANCHORS.federalAssessmentEngage.source,
  },
  {
    title: "Wind SPE is unnamed",
    technical:
      "DCIA §13 leaves a Wind special-purpose entity unnamed, at NL Hydro’s sole discretion. Federal Canada — not CPP — may take up to 40% SPE equity in the public framing. A ~$8B / 100% CPP-held “A” company remains unknown. Do not invent the name.",
  },
];

const DOORS = [
  {
    when: "Tue 29 Sep 2026",
    title: "PUB — Newfoundland Power 2027 Capital Budget letters of comment",
    how: "Written comments to the Board. Not a gallery day. Address: Prince Charles Building, 120 Torbay Road, Suite E210, St. John’s. Board Secretary: board@pub.nl.ca / 709-726-1158.",
    href: "http://pub.nl.ca/applications/NP2027Capital/index.php",
    hrefLabel: "PUB application page",
    paid: false,
  },
  {
    when: "Thu 1 Oct 2026, 3–5 pm NT",
    title: "Mining Industry NL AGM + fall social",
    how: "Sláinte, 115 Duckworth Street, St. John’s. Free Eventbrite registration. Framed as members and stakeholders — not labelled members-only. Confirm edge cases with info@miningnl.com.",
    href: "https://www.eventbrite.ca/e/mining-industry-nl-inc-annual-general-meeting-tickets-1998793590435",
    hrefLabel: "Free Eventbrite",
    paid: false,
  },
  {
    when: "Mon 5 Oct 2026",
    title: "Québec provincial election",
    how: "Political gate for the DCIA counterparty. Watch the result. Not an NL public door — no NL-side campaign events confirmed.",
    href: null,
    hrefLabel: null,
    paid: false,
  },
  {
    when: "Tue 14 Oct 2026, 5–7 pm NT",
    title: "ECO Canada — Future Ready SMEs, The Lantern",
    how: "35 Barnes Road, St. John’s. Free public registration. Workforce / low-carbon networking — not Churchill Falls-specific.",
    href: "https://eco.ca/event/future-ready-smes-advancing-low-carbon-pathways-st-johns/",
    hrefLabel: "Free registration",
    paid: false,
  },
  {
    when: "Thu 15 Oct 2026",
    title: "econext Conference 2026 — Building Our Green Economy",
    how: "Delta Hotel, 120 New Gower Street, St. John’s. Paid registration. Closest in-province industry conference on energy, mining, and major projects in this window.",
    href: "https://econext.ca/2026-conference/",
    hrefLabel: "Paid registration",
    paid: true,
  },
  {
    when: "From Mon 26 Oct 2026",
    title: "House of Assembly fall sitting",
    how: "Confederation Building East Block. Public galleries (photo ID, visitor card, phones checked) or watch the webcast. Order paper unknown until published — Churchill Falls may recur in Question Period. Calendar sitting days start 26 October.",
    href: "https://www.assembly.nl.ca/HouseBusiness/Webcast/",
    hrefLabel: "HOA webcast",
    paid: false,
  },
  {
    when: "Tue 3 – Fri 6 Nov 2026",
    title: "Mineral Resources Review 2026",
    how: "Delta Hotels St. John’s Conference Centre. Conference registration (newfoundland@cim.org). Site notes a public session; exact time unknown until the program drops.",
    href: "https://www.gov.nl.ca/em/mines/mineral/",
    hrefLabel: "Event page",
    paid: true,
  },
  {
    when: "Wed 4 Nov 2026, 6–10 pm",
    title: "Energy NL Industry Achievement Awards",
    how: "Paid / ticketed industry gala. Venue not published on the public page — register for location.",
    href: "https://energynl.ca/industry-achievement-awards/",
    hrefLabel: "Paid registration",
    paid: true,
  },
];

export default function EngagePage() {
  return (
    <SiteShell>
      <main>
        <header className="border-b border-[var(--border-subtle)] px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-36">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              Public campaign · Newfoundland &amp; Labrador
            </p>
            <h1 className="mt-6 font-display text-[2rem] font-normal leading-[1.08] tracking-[-0.022em] sm:text-5xl md:text-[3.4rem]">
              Keep firm power{" "}
              <em className="not-italic text-[var(--plasma)]">in Newfoundland and Labrador</em>.
            </h1>
            <VoiceToggle variant="echo" className="mt-4" />
            <Dual
              plain={
                <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                  {ENGAGE_HERO_LEDE.plain}
                </p>
              }
              technical={
                <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                  {ENGAGE_HERO_LEDE.technical}
                </p>
              }
            />
            <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-[var(--text-muted)]">
              Open People is a constituent and catalyst voice from St. John&apos;s. Tom Lane is not
              a DCIA party, an offtake seat, or a demand seat. Partners would own any steel. This
              page is for people who want the optionality kept in writing.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#write" className="btn-primary justify-center px-6 py-3 text-sm">
                Write in
              </a>
              <a href="#doors" className="btn-secondary justify-center px-6 py-3 text-sm">
                This month&apos;s doors
              </a>
            </div>
          </div>
        </header>

        <section className="border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              01 — Still open
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              The vote did not lock the contracts.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              Public voice still matters because the long-form paper can still say who gets the
              power, on what notice, and whether unused megawatts slide west by default. This is a
              stress-test, not a campaign to scrap the deal.
            </p>
            <div className="mt-10 grid gap-4">
              {OPEN.map((item, i) => (
                <div
                  key={item.title}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
                    {String(i + 1).padStart(2, "0")} · {item.title}
                  </div>
                  {"plain" in item ? (
                    "source" in item ? (
                      <ScaleAnchor
                        className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                        technical={item.technical}
                        plain={item.plain}
                        source={item.source}
                      />
                    ) : (
                      <ScaleAnchor
                        className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                        technical={item.technical}
                        plain={item.plain}
                      />
                    )
                  ) : (
                    <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                      {item.technical}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-[var(--text-muted)]">
              Read the evidence first:{" "}
              <Link href="/brief" className="text-[var(--plasma)] no-underline hover:underline">
                Labrador power &amp; industry case
              </Link>
              {" · "}
              <Link href="/letter" className="text-[var(--plasma)] no-underline hover:underline">
                Letter to the Premier, 15 Sep
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              02 — What to ask for in the contracts
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              Seven checks before the paper hardens.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              No invented megawatts or prices. These are questions the long-form should answer in
              public — or admit it does not.
            </p>
            <ol className="mt-8 space-y-3">
              {ENGAGE_CHECKS.map((item, i) => (
                <li
                  key={item.technical}
                  className="border-l-2 border-[var(--plasma)] bg-[var(--plasma-soft)] px-4 py-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                >
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block">
                    <Dual plain={item.plain} technical={item.technical} />
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="doors"
          className="scroll-mt-24 border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              03 — This month
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              Concrete doors while the paper is still paper.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              Only confirmed public items, with how to get in. The EngageNL Churchill Falls
              questionnaire closed 10 September. No successor energy portal is open.
            </p>
            <div className="mt-10 space-y-4">
              {DOORS.map((door) => (
                <article
                  key={door.title}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
                      {door.when}
                    </p>
                    {door.paid ? (
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--warning)]">
                        Paid
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 font-display text-xl font-normal tracking-[-0.012em]">
                    {door.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {door.how}
                  </p>
                  {door.href ? (
                    <a
                      href={door.href}
                      className="mt-4 inline-block font-mono text-[12px] text-[var(--plasma)] no-underline hover:underline"
                      rel="noopener noreferrer"
                    >
                      {door.hrefLabel} →
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-[var(--text-muted)]">
              House gallery rules:{" "}
              <a
                href="https://www.assembly.nl.ca/VisitLearn/"
                className="text-[var(--plasma)] no-underline hover:underline"
                rel="noopener noreferrer"
              >
                assembly.nl.ca/VisitLearn
              </a>
              . Dates re-checked 22 September 2026. Contingent PUB oral hearings are not listed
              until the Board orders them.
            </p>
          </div>
        </section>

        <section
          id="write"
          className="scroll-mt-24 border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              04 — Write in
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              Tell Tom you want the power kept here.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              Name, email, optional organisation, optional note. This is a mailing list for people
              who want firm in-province power used in NL — not a join-our-AI-company form.
            </p>
            <div className="mt-10 rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-8">
              <EngageForm />
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              05 — Write your MHA
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              Starter questions. You send them. We don&apos;t.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              Find your member on the{" "}
              <a
                href="https://www.assembly.nl.ca/Members/members.aspx"
                className="text-[var(--plasma)] no-underline hover:underline"
                rel="noopener noreferrer"
              >
                House of Assembly members page
              </a>
              {" "}
              (contacts live there — we do not scrape emails onto this site). Mail also reaches MHAs
              at Confederation Building, P.O. Box 8700, St. John&apos;s, NL A1B 4J6. Copy a starter,
              put it in your own words, and send it yourself. Open People will not mail MHAs on your
              behalf.
            </p>
            <div className="mt-10">
              <MhaTemplates />
            </div>
            <ShareEngage />
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-display text-2xl leading-snug sm:text-3xl">
              Keep what we can still keep. Use it on loads that live here.
            </p>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              Mining and Labrador industry first. Compute if — and only if — the province writes it
              as an eligible use of leftover firm power. Partners own the steel. The public owns the
              window until the contracts lock.
            </p>
            <div className="mt-8 font-mono text-sm leading-relaxed text-[var(--text-secondary)]">
              <div>Tom Lane · Open People</div>
              <a
                href="mailto:tom@openpeople.ai?subject=Keep%20firm%20power%20in%20NL"
                className="text-[var(--plasma)] no-underline hover:underline"
              >
                tom@openpeople.ai
              </a>
              <div className="mt-1 text-[var(--text-muted)]">
                St. John&apos;s, Newfoundland and Labrador
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
