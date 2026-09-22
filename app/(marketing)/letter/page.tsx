import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";

const TITLE = "Churchill Falls — put the next generations first";
const DESCRIPTION =
  "A 15 September 2026 constituent letter from Tom Lane to Premier Tony Wakeham on Churchill Falls.";
const CANONICAL = "/letter";
const PUBLISHED = "2026-09-15";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: CANONICAL,
    publishedTime: PUBLISHED,
    locale: "en_CA",
    authors: ["Tom Lane"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const ADDRESS = [
  {
    label: "From",
    lines: ["Tom Lane", "281 Water Street", "St. John’s, Newfoundland and Labrador"],
  },
  {
    label: "Date",
    lines: ["15 September 2026"],
  },
  {
    label: "To",
    lines: [
      "The Honourable Tony Wakeham",
      "Premier of Newfoundland and Labrador",
      "Office of the Premier",
      "Confederation Building",
      "St. John’s, NL",
    ],
  },
  {
    label: "cc",
    lines: ["Sheilagh O’Leary, MHA", "St. John’s East – Quidi Vidi"],
  },
  {
    label: "Re",
    lines: ["Churchill Falls — put the next generations first"],
  },
] as const;

const SECTIONS = [
  { id: "better-price", title: "Take the better price. Keep a door open." },
  { id: "labrador-power", title: "Keep enough power in Labrador to build on." },
  { id: "gull-island", title: "Keep Gull Island a separate decision." },
  { id: "figures", title: "Say the figures the way a treasury would." },
] as const;

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[16px] leading-[1.62] text-[var(--text-secondary)] sm:text-[17px]">
      {children}
    </p>
  );
}

function Pull({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-8 border-l-2 border-[var(--plasma)] bg-[var(--plasma-soft)] px-5 py-4 font-display text-[1.05rem] leading-snug text-[var(--text-primary)] sm:px-6 sm:py-5 sm:text-[1.2rem] sm:leading-[1.48]">
      {children}
    </blockquote>
  );
}

export default function LetterPage() {
  return (
    <SiteShell>
      <main>
        <header className="border-b border-[var(--border-subtle)] px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              Letter · 15 September 2026
            </p>
            <h1 className="mt-6 font-display text-[2rem] font-normal leading-[1.08] tracking-[-0.022em] sm:text-5xl md:text-[3.4rem]">
              Churchill Falls —{" "}
              <em className="not-italic text-[var(--plasma)]">put the next generations first</em>
            </h1>
            <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              A constituent letter from Tom Lane to The Honourable Tony Wakeham, Premier of
              Newfoundland and Labrador. The text below is the 15 September letter, unchanged.
            </p>
            <aside className="mt-8 rounded border border-[rgba(212,168,75,0.22)] bg-[rgba(212,168,75,0.045)] p-5 sm:p-6">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--warning)]">
                After this letter · 17–22 September 2026
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                Two days later the House endorsed the Churchill Falls / Gull Island DCIA framework{" "}
                <strong className="font-semibold text-[var(--text-primary)]">21–18</strong>, with no
                referendum. That vote does not create binding contracts. Next public political gate:
                Québec election <strong className="font-semibold text-[var(--text-primary)]">5 October</strong>.
                Binding definitive agreements are targeted around{" "}
                <strong className="font-semibold text-[var(--text-primary)]">31 December 2026</strong>. The
                DCIA instrument can run to{" "}
                <strong className="font-semibold text-[var(--text-primary)]">31 March 2027</strong>. Innu
                Nation partnership and the federal assessment scope remain unresolved.
              </p>
              <p className="mt-3">
                <Link
                  href="/engage"
                  className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--plasma)] no-underline hover:underline"
                >
                  Get involved — keep firm power here →
                </Link>
              </p>
            </aside>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--border-subtle)] pt-5 font-mono text-[11.5px] tracking-[0.04em] text-[var(--text-muted)]">
              <span>
                <span className="text-[rgba(242,244,246,0.24)]">From</span> Tom Lane · St. John’s, NL
              </span>
              <span>
                <span className="text-[rgba(242,244,246,0.24)]">To</span> Premier Tony Wakeham
              </span>
              <span>
                <span className="text-[rgba(242,244,246,0.24)]">cc</span> Sheilagh O’Leary, MHA
              </span>
            </div>
          </div>
        </header>

        <article className="px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
          <div className="mx-auto max-w-[780px]">
            <div className="overflow-hidden rounded border border-[var(--border-subtle)]">
              {ADDRESS.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid gap-1 bg-[var(--surface-1)] px-4 py-4 sm:grid-cols-[7.5rem_1fr] sm:gap-4 sm:px-5 ${
                    i > 0 ? "border-t border-[var(--border-subtle)]" : ""
                  }`}
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)] sm:pt-0.5">
                    {row.label}
                  </div>
                  <div className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {row.lines.map((line) => (
                      <div key={line} className="text-[var(--text-primary)]">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <nav
              aria-label="Letter sections"
              className="mt-8 border-l border-[var(--border-medium)] pl-4 print:hidden"
            >
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                On this page
              </p>
              <ul className="mt-3 space-y-2">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-[14px] leading-snug text-[var(--text-secondary)] no-underline hover:text-[var(--plasma)]"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-12 space-y-5">
              <p className="font-display text-xl text-[var(--text-primary)] sm:text-2xl">
                Dear Premier Wakeham,
              </p>

              <Body>
                I am Tom Lane. I live at 281 Water Street. I own a restaurant here, and an AI
                company. I am writing as a citizen, not to advance either one.
              </Body>
              <Body>
                The 17 August paper is a framework. It is not yet binding. The 1969 contract still
                governs until new power-purchase agreements are executed. The political target for
                those agreements is 31 December 2026. The framework itself runs to 31 March 2027 if
                they are not signed. Either party can still walk. I am asking you to hold the
                interests of the next generations first of mind while the paper is still paper.
              </Body>
              <Body>
                When the cameras are gone, we will still have to look our children and grandchildren
                in the eye. Energy is the scale of civilization. The next twenty years will reward
                the places that still own firm, clean power at home — power a mine can contract, a
                town can grow on, and a company can build the next industry around. A better price
                today that sells the chance to build tomorrow is only a quieter version of the same
                mistake we have already lived.
              </Body>

              <Body>
                We are not poor in resources. We have the river, the ore, the climate, and a people
                who have already proved they can build what the rest of the country notices. About
                ten thousand people work in our technology sector. It contributes close to two
                billion dollars a year. Last year our companies took most of Atlantic Canada’s
                startup investment. Verafin was built here and stayed here. Kraken Robotics became a
                global ocean company from this harbour.
              </Body>
              <Body>
                That base does not need another announcement about clean energy. It needs firm power
                it can actually contract, this decade, in Labrador, at a published price, on a line
                that reaches the load. Software proved a national company can be built in
                Newfoundland. The next layer — ocean systems, industrial tools, year-round computing
                — runs on electricity. If that electricity is already spoken for, those companies
                will train and host somewhere the lights stay on under someone else’s name.
              </Body>
              <Body>
                The tools for designing, simulating, and solving hard problems are cheaper and more
                widely held than they have ever been. That does not make power less scarce. It makes
                power more decisive. I do not want this province standing on the sidelines while that
                work is done elsewhere and then buying the results back. Whatever our hydro makes
                possible should be made by hands that live here.
              </Body>
            </div>

            <section id="better-price" className="scroll-mt-24 border-t border-[var(--border-subtle)] pt-12 mt-12">
              <h2 className="font-display text-2xl font-normal tracking-[-0.015em] text-[var(--text-primary)] sm:text-3xl">
                Take the better price. Keep a door open.
              </h2>
              <div className="mt-6 space-y-5">
                <Body>
                  I support ending two-tenths of a cent on the plant that already stands. That price
                  was an insult to the people who live beside the water. Taking it off this decade is
                  the right thing to do. Newfoundland and Labrador Hydro has stated that the new
                  schedule starts near 1.8 cents in 2027 and reaches about 11.5 cents by 2041, then
                  follows inflation. That is many times what we are paid today. It is also another
                  contract through 2077, with the same buyer and the same operator of the reservoir.
                </Body>
                <Body>
                  Take the better price. Then put a review in 2051 and 2061. Those years were in the
                  2024 memorandum. They are not in this paper as it has been described in public. A
                  child born this year will be twenty-five and thirty-five then. They should inherit
                  a lock they can still open, not only an inflation clause. Waiting until 2041 is not
                  a plan for them. We do not own a line that can carry this plant to New England.
                  Fifteen more years at the old mill rate does not build one. The eighteen cents
                  mentioned in the House is the number that makes this schedule whole if we wait. It
                  is not an offer Hydro-Québec has made.
                </Body>
                <Body>
                  Versus the 2024 memorandum, cash through 2030 is lighter, and payments start in
                  2027 rather than 2025. That was a trade for structure and megawatts. It should be
                  described as a trade. The promised fifteen percent electricity rebate is a
                  provincial commitment after contracts are signed. It is not a clause Hydro-Québec
                  signed.
                </Body>
              </div>
            </section>

            <section id="labrador-power" className="scroll-mt-24 border-t border-[var(--border-subtle)] pt-12 mt-12">
              <h2 className="font-display text-2xl font-normal tracking-[-0.015em] text-[var(--text-primary)] sm:text-3xl">
                Keep enough power in Labrador to build on.
              </h2>
              <div className="mt-6 space-y-5">
                <Body>
                  The abundance is the power we keep and use here. Recapture today is 525 megawatts,
                  not the larger headline that arrives only if new plants are built. The material
                  terms describe Newfoundland and Labrador volumes as first-out of the plant. That
                  protection should survive in the long-form. If we do not use what we keep,
                  Hydro-Québec has already written a price for it — one and a half times the new
                  rate, with notice. That is a reservation price, not a development plan.
                </Body>
                <Body>
                  Before this is called a development agreement, there should be a public allocation:
                  the year, the megawatts, the place, the price, and which line. Mines first on the
                  western line. Towns. Then year-round industrial load at Churchill Falls or Goose
                  Bay, written as a named use of Labrador power alongside the mines, on a line that
                  exists, at a published rate. If that page is blank, unused power will go west by
                  indecision.
                </Body>
                <Body>
                  Fibre belongs with the power. Labrador’s long-haul network is essentially one path
                  along the highway and the corridor that already runs into Quebec. If a transatlantic
                  cable lands at Goose Bay and the terrestrial pairs simply follow that corridor, the
                  next industrial load will be built where the traffic already breaks out. Ownership
                  of the landing, open access, and an eastbound path toward this Island should be
                  conditions of any approval. Otherwise we will have exported the next industry the
                  same way we exported the last one.
                </Body>
              </div>
            </section>

            <section id="gull-island" className="scroll-mt-24 border-t border-[var(--border-subtle)] pt-12 mt-12">
              <h2 className="font-display text-2xl font-normal tracking-[-0.015em] text-[var(--text-primary)] sm:text-3xl">
                Keep Gull Island a separate decision.
              </h2>
              <div className="mt-6 space-y-5">
                <Body>
                  Gull Island is a new plant. It is not payment for 1969. The financing is better
                  than the last memorandum, and the clause that would have left a mountain of leftover
                  debt is gone. That is worth saying. It is still a fifty-year contract for a dam that
                  does not exist. Assignment of the Lower Churchill Impacts and Benefits Agreement to
                  any Gull Island entity has already been named as a condition of closing. An Innu
                  equity partnership is not yet signed. Innu Nation is not a party to the paper on the
                  table this week. Quebec votes on the fifth of October.
                </Body>
                <Body>
                  If Gull Island does not proceed, volume-cap clauses in the present paper can change
                  what we keep from the plant we already built. Those clauses are not on one public
                  sheet a voter can check. Unpoured concrete should not decide what our children keep.
                  The reopen of the existing plant, and the recapture we already have, should stand in
                  words a court can read even if Gull Island never reaches first power.
                </Body>
              </div>
            </section>

            <section id="figures" className="scroll-mt-24 border-t border-[var(--border-subtle)] pt-12 mt-12">
              <h2 className="font-display text-2xl font-normal tracking-[-0.015em] text-[var(--text-primary)] sm:text-3xl">
                Say the figures the way a treasury would.
              </h2>
              <div className="mt-6 space-y-5">
                <Body>
                  The $49 billion and $273 billion totals being used in public combine the existing
                  plant, a plant that has not been built, federal support, and construction other
                  governments help finance. Federal money in this file is largely loan guarantees, tax
                  credits, and line support — not a cheque to this treasury. Hydro-Québec still owns
                  34.2 percent of Churchill Falls (Labrador) Corporation, so a third of what is paid
                  there returns to Quebec as a dividend. When a figure is offered as ours, it should
                  be stated as what this treasury keeps.
                </Body>
                <Body>
                  The 985 megawatts of transmission announced on 17 August unpacks, in the
                  government’s own release, as 240 megawatts priced off the Champlain Hudson Power
                  Express contract, 200 megawatts priced off the New England Clean Energy Connect
                  contract, 280 megawatts of synthetic exports, and 265 megawatts of a reserved path.
                  The first three are prices at the Quebec border. They are not a wire this province
                  operates. That formula is worth having. It should not be described as if it were.
                </Body>
                <Body>
                  Some of this is in the published annexes. The power-purchase agreements that would
                  actually bind us have not been signed. Until a year-by-year table of dollars and
                  volumes, and the cap table if Gull Island is not built, are public, people of good
                  faith will keep arguing past one another. That is not a basis on which to ask the
                  public for a final opinion.
                </Body>
                <Body>
                  I am asking you to treat the existing-plant reopen, the recapture and industrial
                  allocation, and Gull Island as three conversations, not one motion. I am asking that
                  the better price on the plant we have already built survive if the new dam does not;
                  that 2051 and 2061 be written in for the children born this year; that Labrador’s
                  unused power be scheduled onto loads in this province, at a published price, before
                  it is sold back; that a Goose Bay landing, if it comes, turn east as well as west;
                  and that Gull Island be conditioned on an Innu partnership that is equity, a defined
                  cap on leftover capital, and language that cannot quietly cut what we keep from the
                  old plant.
                </Body>
                <Body>I would be grateful for a written reply before this sitting ends.</Body>
              </div>
            </section>

            <Pull>
              Premier, I am asking you plainly: put the next generations first. Hold what we can
              hold. Our people will use it. They always were ingenious enough. What they have lacked
              is kilowatts that still belonged to us when they were ready.
            </Pull>

            <div className="mt-12 border-t border-[var(--border-subtle)] pt-10">
              <p className="text-[16px] leading-relaxed text-[var(--text-secondary)] sm:text-[17px]">
                Respectfully,
              </p>
              <p className="mt-6 font-display text-xl text-[var(--text-primary)] sm:text-2xl">
                Tom Lane
              </p>
              <p className="mt-2 font-mono text-[12px] leading-relaxed text-[var(--text-muted)]">
                281 Water Street
                <br />
                St. John’s, NL
              </p>
            </div>

            <aside className="mt-12 rounded border border-[rgba(212,168,75,0.22)] bg-[rgba(212,168,75,0.045)] p-5 sm:p-6">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--warning)]">
                Footnote
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                The 17 August instrument is a framework. The 1969 contract still governs until new
                power-purchase agreements are executed. The target date for those agreements is 31
                December 2026. The framework itself runs to 31 March 2027 if they are not signed.
              </p>
            </aside>

            <div className="mt-14 flex flex-col gap-3 print:hidden sm:flex-row">
              <Link href="/engage" className="btn-primary justify-center px-5 py-3 text-sm">
                Get involved — keep firm power here
              </Link>
              <Link href="/brief" className="btn-secondary justify-center px-5 py-3 text-sm">
                Labrador Compute Case
              </Link>
            </div>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
