import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import EngageForm from "./EngageForm";
import MhaTemplates from "./MhaTemplates";

export const metadata: Metadata = {
  title: "Keep firm power in NL",
  description:
    "The Churchill Falls / Gull Island DCIA is a framework, not binding contracts. A public path to keep firm power in Newfoundland and Labrador for industry — mining first, compute as a named use.",
  alternates: { canonical: "/engage" },
};

const OPEN = [
  {
    title: "Binding paper is still unsigned",
    body: "The House endorsed the DCIA framework 21–18 on 17 September 2026. That vote does not create power-purchase agreements. Definitive agreements are targeted around 31 December 2026. The DCIA instrument can run to 31 March 2027.",
  },
  {
    title: "Québec votes 5 October",
    body: "The next public political gate is the Québec election. It is not an NL door you can walk through. It still matters for the counterparty government.",
  },
  {
    title: "In-province use is still optional",
    body: "Public framing is about 2,350 MW retained from Churchill Falls and Gull Island, plus wind if built. That is announcement language, not a signed compute tranche, not a published industrial queue, and not a confirmed preference versus Hydro-Québec or mining.",
  },
  {
    title: "Recall language is still open",
    body: "Jason Chee-Aloy of Power Advisory told the House a three-year notice recall could let NL keep more power at home. That is testimony. It is not confirmed in signed contract text.",
  },
  {
    title: "Innu Nation partnership is unresolved",
    body: "Innu Nation urged MHAs not to vote. The Premier said he will meet. Royalty and Gull Island tariff path remain unsettled. Nothing large in Labrador proceeds without that work.",
  },
  {
    title: "Federal environmental assessment is a live gap",
    body: "IAAC has said no new federal impact assessment is needed if 2026 Gull Island matches the 2006–2012 Lower Churchill review. The agency has not received proponent confirmation that the scopes match. The 2026 plant as described is larger than the roughly 2,000 MW reviewed then.",
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
            <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              The Churchill Falls / Gull Island DCIA is a framework. The House endorsed it. Binding
              contracts are not signed. There is still time to insist that firm power this province
              keeps is used here — mines and Labrador industry first. Compute is one named use of
              that power, not the opener, and not a reserved block.
            </p>
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
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-[var(--text-muted)]">
              Read the evidence first:{" "}
              <Link href="/brief" className="text-[var(--plasma)] no-underline hover:underline">
                Labrador Compute Case
              </Link>
              {" · "}
              <Link href="/letter" className="text-[var(--plasma)] no-underline hover:underline">
                Letter to the Premier, 15 Sep
              </Link>
              .
            </p>
          </div>
        </section>

        <section
          id="doors"
          className="scroll-mt-24 border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              02 — This month
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
              03 — Write in
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
              04 — Write your MHA
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              Starter questions. You send them. We don&apos;t.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              Find your member on the{" "}
              <a
                href="https://www.assembly.nl.ca/Members/"
                className="text-[var(--plasma)] no-underline hover:underline"
                rel="noopener noreferrer"
              >
                House of Assembly members list
              </a>
              . Copy a starter, put it in your own words, and send it yourself. Open People will not
              mail MHAs on your behalf.
            </p>
            <div className="mt-10">
              <MhaTemplates />
            </div>
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
