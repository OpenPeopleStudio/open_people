import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Fig, Term, Unfold } from "@/components/marketing/depth";
import { StatusPill } from "@/components/marketing/desk";
import { DefaultPath, GateClock } from "@/components/marketing/instruments";
import { DESK_SOURCES, TRACKER_ITEMS } from "@/lib/desk";
import { deskMetadata } from "@/lib/og/metadata";
import {
  ENGAGE_CHECKS,
  ENGAGE_HERO_LEDE,
  SCALE_ANCHORS,
} from "@/lib/voice-mode";
import EngageForm from "./EngageForm";
import MhaTemplates from "./MhaTemplates";
import ShareEngage from "./ShareEngage";
import PrintButton from "./PrintButton";

export const metadata = deskMetadata({
  title: "Keep firm power in NL",
  description:
    "The Churchill Falls / Gull Island DCIA is a framework, not binding contracts. Seven checks an MHA can put to the long-form before it hardens. Mining first. Compute is a named use, not a reserved block.",
  path: "/engage",
  ogDescription:
    "House endorsement is not a contract. Keep Churchill Falls / Gull Island firm power in-province — mines and Labrador industry first.",
});

const OPEN = [
  {
    id: "eng-binding",
    title: "Binding paper is still unsigned",
    label: "31 Dec",
    plain: (
      <>
        The House said yes <Fig id="a">21–18</Fig> in September. That vote does not write the
        power-purchase contracts. Binding paper is aimed at around <Fig id="b">year-end</Fig>. The
        framework clock can run into March 2027, and the Premier has not promised MHAs a vote on the
        final text.
      </>
    ),
    technical:
      "The House endorsed the DCIA framework 21–18 on 17 September 2026. That vote does not create PPAs. Definitive Agreements are targeted by 31 December 2026 (Art. 2.1); the DCIA Term runs to 31 March 2027 unless extended (§6.3(a)), with HQ Gull Island exclusivity during the Term (§6.3(b)). On 18 September the Premier said the deal will return to the House before definitive agreements but would not commit to a vote.",
    sources: [DESK_SOURCES.dciaHq, DESK_SOURCES.ntvVote, DESK_SOURCES.vocmOpposition],
  },
  {
    id: "eng-qc",
    title: "Québec votes 5 October",
    label: "5 Oct",
    plain: (
      <>
        Next public political gate is <Fig id="a">5 October</Fig> in Québec. It is not an NL door
        you can walk through. The party that signed is running third; the front-runner says it does
        not plan to tear the deal up but wants time to study it.
      </>
    ),
    technical:
      "Québec general election 5 October 2026. Léger (21 Sep): PQ 29, PLQ 23, CAQ 20, PCQ 17, QS 10. Fréchette has said a final deal needs CAQ re-election; PSPP says he has no intention of tearing up the agreement if it is good for Québec. Polls are context, not a gate. Outcome UNKNOWN.",
    sources: [DESK_SOURCES.qcElection, DESK_SOURCES.radioCanadaQcOpposition],
  },
  {
    id: "eng-inprovince",
    title: "In-province use is still optional",
    label: "2,350 MW",
    plain: (
      <>
        Public talk is enough firm power for a few large industrial campuses, about{" "}
        <Fig id="a">2,350 MW</Fig>. It is still not a year-by-year signed list of who gets it, and not
        a confirmed preference versus Hydro-Québec or mining.
      </>
    ),
    technical: SCALE_ANCHORS.retainedMwEngage.technical,
    sources: [DESK_SOURCES.govNlDcia, DESK_SOURCES.dciaHq],
  },
  {
    id: "eng-recall",
    title: "Recall language is still open",
    label: "three-year notice",
    plain: (
      <>
        A consultant told the House a <Fig id="a">three-year notice</Fig> recall could let NL keep
        more power at home. That is testimony. It is not confirmed in signed contract text.
      </>
    ),
    technical:
      "Jason Chee-Aloy of Power Advisory told the House a three-year notice recall could let NL keep more power at home. Material Terms describe three-year notice for recapture of volumes previously sold to HQ, for domestic load. Whether that survives into the Definitive Agreements is not public.",
    sources: [DESK_SOURCES.dciaHq, DESK_SOURCES.powerAdvisory],
  },
  {
    id: "eng-innu",
    title: "Innu Nation partnership is unresolved",
    label: "the Innu file",
    plain: (
      <>
        <Term k="innu-nation">Innu Nation</Term> urged MHAs not to vote and says the paper cuts its
        benefits by more than half. The Premier says he looks forward to sitting down; as of 21
        September nothing is scheduled. Royalty and Gull Island tariff path remain unsettled. Nothing
        large in Labrador proceeds without that work.
      </>
    ),
    technical: TRACKER_ITEMS.find((i) => i.id === "innu")?.body.technical ?? "",
    sources: [DESK_SOURCES.vocmInnuContact, DESK_SOURCES.radioCanadaInnu, DESK_SOURCES.vocmInnuReady],
  },
  {
    id: "eng-federal",
    title: "Federal environmental assessment is a live gap",
    label: "2,000 MW",
    plain: (
      <>
        Ottawa has not yet confirmed this plant matches the older review. The 2026 description is
        larger than the roughly <Fig id="a">2,000 MW</Fig> studied then.
      </>
    ),
    technical: SCALE_ANCHORS.federalAssessmentEngage.technical,
    sources: [DESK_SOURCES.cbcIaac],
  },
  {
    id: "eng-wind",
    title: "Wind company is unnamed",
    label: "the SPE",
    plain: (
      <>
        The paper leaves the wind company, an <Term k="spe">SPE</Term>, unnamed and at NL
        Hydro&apos;s sole discretion. Do not invent the name, the dollar figure, or a federal share.
      </>
    ),
    technical:
      "DCIA Schedule B §7 leaves a Wind special-purpose entity unnamed, held as NLH may determine. HQ pays GNL $400,000/MW (about $640M on 1,600 MW) on completion of FEL 1–3, permits and PPA. Federal Canada, not CPP, may take up to 40% SPE equity in the public framing. A ~$8B / 100% CPP-held “A” company remains unknown.",
    sources: [DESK_SOURCES.dciaHq, DESK_SOURCES.govNlDcia],
  },
];

/** Each of the seven checks maps to a tracker row so its status is live. */
const CHECK_ROWS = ["metering", "domestic-load", "unused-retain", "binding-window", "domestic-load", "innu", "gull-island"] as const;

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
    <DeskPage
      kicker="Public campaign · Newfoundland and Labrador"
      title={
        <>
          Keep firm power <em>in Newfoundland and Labrador.</em>
        </>
      }
      lede={
        <Unfold
          id="engage-lede"
          label="the framework"
          plain={<p>{ENGAGE_HERO_LEDE.plain}</p>}
          technical={ENGAGE_HERO_LEDE.technical}
          sources={[DESK_SOURCES.dciaHq, DESK_SOURCES.govNlDcia]}
        />
      }
      meta={
        <p className="text-[15px] leading-relaxed text-[var(--ink-3)]">
          Open People is a constituent and catalyst voice from St. John&apos;s. Tom Lane is not a
          party to the agreement, an offtake seat, or a demand seat. Partners would own any steel.
          This page is for people who want the optionality kept in writing.
        </p>
      }
      actions={
        <>
          <a href="#write" className="btn-primary">
            Write in
          </a>
          <a href="#checks" className="btn-secondary">
            The seven checks
          </a>
          <PrintButton />
        </>
      }
      hero={<GateClock compact />}
      sections={[
        { id: "open", label: "Still open" },
        { id: "checks", label: "Seven checks" },
        { id: "default", label: "The default path" },
        { id: "doors", label: "This month's doors" },
        { id: "write", label: "Write in" },
        { id: "mha", label: "Write your MHA" },
      ]}
    >
      <DeskSection
        id="open"
        num="01 — Still open"
        title="The vote did not lock the contracts."
        intro={
          <p>
            Public voice still matters because the long-form paper can still say who gets the power,
            on what notice, and whether unused megawatts slide west by default. This is a stress-test,
            not a campaign to scrap the deal.
          </p>
        }
      >
        <div className="grid gap-3">
          {OPEN.map((item, i) => (
            <div key={item.id} className="desk-surface p-5 sm:p-6" data-rise>
              <div className="desk-kicker">
                {String(i + 1).padStart(2, "0")} · {item.title}
              </div>
              <Unfold
                id={item.id}
                className="mt-3"
                label={item.label}
                plain={<p className="desk-takeaway">{item.plain}</p>}
                technical={item.technical}
                sources={item.sources}
              />
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-[var(--ink-3)]">
          Read the evidence first:{" "}
          <Link href="/brief" className="desk-link">
            Labrador power &amp; industry case
          </Link>
          {" · "}
          <Link href="/letter" className="desk-link">
            Letter to the Premier, 15 Sep
          </Link>
          .
        </p>
      </DeskSection>

      <DeskSection
        id="checks"
        num="02 — What to ask for in the contracts"
        title="Seven checks before the paper hardens."
        intro={
          <p>
            No invented megawatts or prices. These are questions the long-form should answer in
            public, or admit it does not. Each one carries the live status of the tracker row it maps
            to. Print this page and hand it to your MHA.
          </p>
        }
      >
        <ol className="grid gap-3" aria-label="Seven checks">
          {ENGAGE_CHECKS.map((item, i) => {
            const row = TRACKER_ITEMS.find((t) => t.id === CHECK_ROWS[i]);
            return (
              <li key={item.technical} className="desk-surface p-5 sm:p-6" data-rise>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="desk-kicker">Check {String(i + 1).padStart(2, "0")}</span>
                  {row ? (
                    <span className="flex items-center gap-2">
                      <span className="desk-fact text-[var(--ink-3)]">status today</span>
                      <StatusPill status={row.status} />
                    </span>
                  ) : null}
                </div>
                <Unfold
                  id={`check-${i + 1}`}
                  className="mt-3"
                  plain={<p className="desk-takeaway">{item.plain}</p>}
                  technical={
                    <>
                      <p>{item.technical}</p>
                      {row ? (
                        <p className="mt-2">
                          Tracker:{" "}
                          <Link href={`/tracker#${row.id}`} className="desk-link">
                            {row.title} →
                          </Link>
                        </p>
                      ) : null}
                    </>
                  }
                  sources={row ? row.sources.slice(0, 2).map((id) => DESK_SOURCES[id]) : []}
                />
              </li>
            );
          })}
        </ol>
      </DeskSection>

      <DeskSection
        id="default"
        num="03 — The default path"
        title="If nobody writes anything else, the paper already decides."
        wide
      >
        <div data-rise>
          <DefaultPath />
        </div>
      </DeskSection>

      <DeskSection
        id="doors"
        num="04 — This month"
        title="Concrete doors while the paper is still paper."
        intro={
          <p>
            Only confirmed public items, with how to get in. The EngageNL Churchill Falls
            questionnaire closed 10 September. No successor energy portal is open.
          </p>
        }
      >
        <div className="grid gap-3">
          {DOORS.map((door) => (
            <article key={door.title} className="desk-surface p-5 sm:p-6" data-rise>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="desk-kicker">{door.when}</p>
                {door.paid ? (
                  <span className="desk-fact uppercase tracking-[0.1em] text-[var(--amber)]">Paid</span>
                ) : null}
              </div>
              <h3 className="desk-h3 mt-2">{door.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">{door.how}</p>
              {door.href ? (
                <a href={door.href} className="desk-link desk-fact mt-4 inline-block" rel="noopener noreferrer">
                  {door.hrefLabel} →
                </a>
              ) : null}
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-[var(--ink-3)]">
          House gallery rules:{" "}
          <a href="https://www.assembly.nl.ca/VisitLearn/" className="desk-link" rel="noopener noreferrer">
            assembly.nl.ca/VisitLearn
          </a>
          . Dates re-checked 22 September 2026. Contingent PUB oral hearings are not listed until
          the Board orders them.
        </p>
      </DeskSection>

      <DeskSection
        id="write"
        num="05 — Write in"
        title="Tell Tom you want the power kept here."
        intro={
          <p>
            Name, email, optional organisation, optional note. This is a mailing list for people who
            want firm in-province power used in NL, not a join-our-AI-company form.
          </p>
        }
      >
        <div className="desk-surface p-5 sm:p-8">
          <EngageForm />
        </div>
      </DeskSection>

      <DeskSection
        id="mha"
        num="06 — Write your MHA"
        title="Starter questions. You send them. We don't."
        intro={
          <p>
            Find your member on the{" "}
            <a href="https://www.assembly.nl.ca/Members/members.aspx" className="desk-link" rel="noopener noreferrer">
              House of Assembly members page
            </a>{" "}
            (contacts live there; we do not scrape emails onto this site). Mail also reaches MHAs at
            Confederation Building, P.O. Box 8700, St. John&apos;s, NL A1B 4J6. Copy a starter, put it
            in your own words, and send it yourself. Open People will not mail MHAs on your behalf.
          </p>
        }
      >
        <MhaTemplates />
        <ShareEngage />
      </DeskSection>

      <DeskSection id="close">
        <p className="desk-h2">Keep what we can still keep. Use it on loads that live here.</p>
        <p className="desk-body mt-5">
          Mining and Labrador industry first. <Term k="compute">Compute</Term> if, and only if, the
          province writes it as an eligible use of leftover firm power. Partners own the steel. The
          public owns the window until the contracts lock.
        </p>
        <div className="desk-fact mt-8 leading-relaxed text-[var(--ink-2)]">
          <div>Tom Lane · Open People</div>
          <a href="mailto:tom@openpeople.ai?subject=Keep%20firm%20power%20in%20NL" className="desk-link">
            tom@openpeople.ai
          </a>
          <div className="mt-1 text-[var(--ink-3)]">St. John&apos;s, Newfoundland and Labrador</div>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
