import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Fig, Figure, Term, Unfold, WalkLaunch } from "@/components/marketing/depth";
import { DefaultPath, GateClock, UnknownBoard } from "@/components/marketing/instruments";
import { DESK_SOURCES, DESK_VERIFIED } from "@/lib/desk";
import { HOME_DESCRIPTION } from "@/lib/og/copy";
import { deskMetadata } from "@/lib/og/metadata";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

/** Search title only. The on-page heading stays the company line. */
const HOME_SEARCH_TITLE = "Churchill Falls power — Open People";

export const metadata = deskMetadata({
  title: { absolute: HOME_SEARCH_TITLE },
  description: HOME_DESCRIPTION,
  path: "/",
});

const OPEN = [
  {
    id: "open-inprovince",
    title: "In-province use",
    label: "2,350 MW",
    plain: (
      <>
        Public talk is enough firm power for a few large industrial campuses, about{" "}
        <Fig id="a">2,350 MW</Fig>. It is still not a year-by-year signed list of who gets it.
      </>
    ),
    technical: SCALE_ANCHORS.retainedMw.technical,
    sources: [DESK_SOURCES.govNlDcia, DESK_SOURCES.dciaHq],
  },
  {
    id: "open-recall",
    title: "Recall",
    label: "three-year notice",
    plain: (
      <>
        The paper describes a <Fig id="a">three-year notice</Fig> to take power back. House
        testimony is not a signed contract.
      </>
    ),
    technical:
      "Material Terms describe three-year notice for several HQ sale and recapture paths. Consultant testimony to the House about a recall right is not a substitute for signed PPAs. Still a framework.",
    sources: [DESK_SOURCES.dciaHq],
  },
  {
    id: "open-innu",
    title: "Innu Nation",
    label: "the Innu file",
    plain: (
      <>
        <Term k="innu-nation">Innu Nation</Term> asked MHAs not to vote and says the paper cuts its
        benefits by more than half. Partnership, royalty, and Gull Island tariff path are still open.
        As of 21 September no meeting is scheduled.
      </>
    ),
    technical:
      "Innu Nation wrote MHAs on 17 September urging a no vote; Grand Chief Jodie Ashini says benefits were cut by over half versus the 2024 MOU (no figures released). The Premier said outstanding issues need to be resolved and he looks forward to sitting down. VOCM 21 Sep: the Innu are ready to meet, nothing is scheduled, and they were never invited to the DCIA table. Innu communities on the Québec side say their consent is mandatory too.",
    sources: [DESK_SOURCES.vocmInnuContact, DESK_SOURCES.radioCanadaInnu, DESK_SOURCES.aptnQcInnu],
  },
  {
    id: "open-federal",
    title: "Federal assessment",
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
];

const DOORS = [
  { href: "/tracker", label: "Tracker", k: "What we can show is signed, what is open, and what is still blank" },
  { href: "/industries", label: "Industries", k: "Mining and Labrador industry first — and the wire they need" },
  { href: "/costs", label: "Costs", k: "Seven price families. We keep them labelled, not merged" },
  { href: "/brief", label: "Brief", k: "The case we are making, end to end" },
];

const RULES = [
  "Evidence before narrative",
  "No crypto — permanent",
  "Never lead with “cheap power”",
  "Indigenous engagement first-class",
  "Open People leads the proposed campus",
];

export default function HomePage() {
  return (
    <DeskPage
      kicker="Open People · Newfoundland and Labrador"
      title={
        <>
          Keep the power here. <em>Open People is on it.</em>
        </>
      }
      lede={
        <Unfold
          id="hero-scale"
          label="43 TWh"
          plain={
            <p>
              Open People is working to keep firm Churchill Falls and Gull Island power in
              Newfoundland and Labrador. The province generates about <Fig id="a">43 TWh</Fig> of
              clean electricity a year and ships most of it out. Mining and resources come first on
              what stays. August&apos;s paper and the September House vote (<Fig id="b">21–18</Fig>)
              are a <Term k="framework">framework</Term> and a political yes. The contracts that lock
              the power are still ahead. That is why this is public now — and why you can still
              write in.
            </p>
          }
          technical={SCALE_ANCHORS.exportScale.technical}
          sources={[DESK_SOURCES.cerRenewables, DESK_SOURCES.cerNl, DESK_SOURCES.dciaHq]}
        />
      }
      meta={
        <p className="desk-body">
          We publish the file, and we lead a proposed use. Firm in-province power should serve
          Labrador and island industry,{" "}
          <strong className="font-semibold text-[var(--ink)]">mining and resources first</strong>.
          Open People leads a proposed 500 MW Labrador campus and a research campus, in feasibility.
          We are not a party to the Churchill Falls agreement.
        </p>
      }
      actions={
        <>
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <Link href="/tracker" className="btn-secondary">
            What is still open
          </Link>
          <WalkLaunch className="sm:ml-3" />
        </>
      }
      hero={<GateClock />}
      sections={[
        { id: "hold", label: "The power" },
        { id: "blank", label: "What is still blank" },
        { id: "default", label: "The default path" },
        { id: "doors", label: "Where to go" },
        { id: "rules", label: "How we work" },
      ]}
      walkthrough={{
        title: "Walk me through it",
        steps: [
          {
            anchor: "gate-clock",
            text: "Start with the dates. Two are behind us, two are targets, and one preliminary year is a decade out. We do not forecast these.",
            unfold: "hero-scale",
          },
          {
            anchor: "hold",
            text: "This is the power we are working to keep in play: clean firm power for the mines, the towns, and other industry. Most of it leaves the province today.",
            unfold: "hold-unfold",
          },
          {
            anchor: "blank",
            text: "This is the gap. The public paper still does not say who gets retained power, year by year, or what “used here” means.",
            unfold: "open-inprovince",
          },
          {
            anchor: "default",
            text: "If nobody writes anything else, the west branch is already in the Material Terms. The home branch is not defined. We want the contracts to say what “used here” means.",
          },
          {
            anchor: "doors",
            text: "Four ways into the work. Or go to Engage and put a question to your MHA before the paper hardens.",
          },
        ],
      }}
    >
      <DeskSection
        id="hold"
        num="01 — What the province holds"
        title="One of the cleanest large power systems in North America. Most of it leaves."
        wide
      >
        <div className="desk-grid-hair sm:grid-cols-2 lg:grid-cols-4" data-rise>
          {[
            {
              value: "43.1",
              unit: "TWh renewable, 2023",
              status: "published-rate" as const,
              sources: [DESK_SOURCES.cerRenewables],
              note: "Canada Energy Regulator: 44.3 TWh generated, 43.1 TWh renewable (97.4%), 2023.",
            },
            {
              value: "97%",
              unit: "hydro share of generation",
              status: "published-rate" as const,
              sources: [DESK_SOURCES.cerNl],
              note: "CER NL provincial profile: about 97% hydro; oil is 9% of capacity but 2% of generation.",
            },
            {
              value: "34.5",
              unit: "TWh net outflows, 2023",
              status: "published-rate" as const,
              sources: [DESK_SOURCES.cerNl],
              note: "CER NL provincial profile: net interprovincial and international outflows 34.5 TWh (2023), overwhelmingly to Québec.",
            },
            {
              value: "5,428",
              unit: "MW at Churchill Falls",
              status: "published-rate" as const,
              sources: [DESK_SOURCES.cerNl],
              note: "Rated capacity of the existing plant. CF(L)Co: NL Hydro 65.8%, Hydro-Québec 34.2%.",
            },
          ].map((f) => (
            <div key={f.unit} className="p-6 sm:p-7">
              <Figure
                value={f.value}
                unit={f.unit}
                status={f.status}
                size="lg"
                sources={f.sources}
                lastVerified={DESK_VERIFIED}
                note={f.note}
              />
            </div>
          ))}
        </div>
        <div className="desk-prose mt-10">
          <Unfold
            id="hold-unfold"
            label="0.2¢"
            plain={
              <p className="desk-takeaway">
                Under the 1969-lineage contract, Churchill Falls export power has been priced at{" "}
                <Fig id="a">two <Term k="mill">mills</Term></Fig>, two tenths of a cent, until 2041.
                That is lore about what left the border, not a rate anyone here can buy power at
                today. The question now is not the export price. It is whether the province writes
                down what it keeps. That is the work Open People is in.
              </p>
            }
            technical={SCALE_ANCHORS.heritagePrice.technical}
            sources={[DESK_SOURCES.heritage1969, DESK_SOURCES.feehanBaker, DESK_SOURCES.policyOptions2010]}
          />
        </div>
      </DeskSection>

      <DeskSection
        id="blank"
        num="02 — What is still blank"
        title="Endorsement is not a contract."
        intro={
          <p>
            Open People is in this stretch on purpose. Québec&apos;s election is behind us: a Parti
            Québécois minority, and no decision on this paper. Binding contracts are still the target
            around year-end. The Premier says the deal comes back to the House before then, but has
            not promised MHAs a vote. You can still insist on transparency and in-province use,
            without pretending the deal is finished, and without a sermon against it.
          </p>
        }
        wide
      >
        <div data-rise>
          <UnknownBoard includeOpen />
        </div>
        <div className="desk-prose mt-14 grid gap-3">
          {OPEN.map((item, i) => (
            <div key={item.id} className="desk-surface p-6 sm:p-7" data-rise>
              <div className="desk-kicker">
                {String(i + 1).padStart(2, "0")} · {item.title}
              </div>
              <Unfold
                id={item.id}
                className="mt-4"
                label={item.label}
                plain={<p className="desk-takeaway">{item.plain}</p>}
                technical={item.technical}
                sources={item.sources}
              />
            </div>
          ))}
          <Link href="/tracker" className="desk-kicker mt-6 inline-flex items-center gap-2 no-underline hover:underline">
            The full board →
          </Link>
        </div>
      </DeskSection>

      <DeskSection
        id="default"
        num="03 — The default path"
        title="If nobody writes anything else, the paper already decides."
        intro={
          <p>
            We publish the default because it is already written. The Material Terms describe what
            happens to retained power that is not used at home. It has a buyer. Leftover megawatts
            do not sit still.
          </p>
        }
        wide
      >
        <div data-rise>
          <DefaultPath />
        </div>
        <div className="desk-prose mt-10">
          <Unfold
            id="default-unfold"
            label="95%"
            plain={
              <p className="desk-takeaway">
                If NL does not use retained power at home, the paper already names ways Hydro-Québec
                can buy it, including a <Fig id="a">95%</Fig> default price if there is no three-year
                notice. What <Term k="domestic-load">“used here”</Term> means in words a voter can
                check is still not written.
              </p>
            }
            technical="Schedule B §4(b)(iv): unplanned unused energy to serve domestic load may be sold to HQ at 95% of the applicable PPA price; HQ is obligated to purchase. Other HQ sale options (synthetic export up to 280 MW; CHPE-equivalent up to 240 MW; NECEC-equivalent up to 200 MW; 1.5× premium on CF entitlements) require at least three years' notice. Schedule B §4 ties NLH entitlements to “domestic load” without defining it. These are Material Terms for later PPAs, not executed offtake."
            sources={[DESK_SOURCES.dciaHq, DESK_SOURCES.dciaNl]}
          />
        </div>
      </DeskSection>

      <DeskSection id="doors" num="04 — Where to go" title="Four ways into the work." wide>
        <div className="desk-grid-hair sm:grid-cols-2 lg:grid-cols-4" data-rise>
          {DOORS.map((item) => (
            <Link key={item.href} href={item.href} className="p-6 no-underline transition-colors hover:bg-[var(--surface-2)] sm:p-7">
              <div className="desk-kicker">{item.label}</div>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">{item.k}</p>
            </Link>
          ))}
        </div>
      </DeskSection>

      <DeskSection id="rules" num="05 — How we work" title="Rules we publish so you can hold us to them.">
        <ul className="desk-rule-list" data-rise>
          {RULES.map((r, i) => (
            <li key={r}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[15px] text-[var(--ink-2)]">{r}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-[var(--ink-3)]">
          Full operating doctrine:{" "}
          <Link href="/approach" className="desk-link">
            Approach
          </Link>
          . Proposed campus, Open People leads:{" "}
          <Link href="/compute" className="desk-link">
            /compute
          </Link>
          .
        </p>
      </DeskSection>

      <DeskSection id="close">
        <p className="desk-h2">
          The contracts are still paper. Open People is in that work now. If you are, start here.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <a href="mailto:tom@openpeople.ai" className="btn-secondary">
            tom@openpeople.ai
          </a>
        </div>
        <div className="desk-fact mt-10 leading-relaxed text-[var(--ink-2)]">
          <div>Tom Lane · Founder, Open People</div>
          <div className="mt-1 text-[var(--ink-3)]">St. John&apos;s, Newfoundland and Labrador</div>
        </div>
        <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href="/letter"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]"
          >
            Letter to the Premier · 15 Sep 2026 →
          </Link>
          <Link
            href="/vision"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]"
          >
            Vision →
          </Link>
        </p>
      </DeskSection>
    </DeskPage>
  );
}
