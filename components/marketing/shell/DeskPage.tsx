import type { ReactNode } from "react";
import SiteShell from "@/components/marketing/SiteShell";
import { RevealObserver, WalkSteps, type WalkStep } from "@/components/marketing/depth";
import { DESK_VERIFIED } from "@/lib/desk";
import { MobileStrip, Rail, type RailSection } from "./Rail";

/**
 * One shell for every public route. Kicker, headline, lede, verified line,
 * optional hero content (an instrument), then sections. Rail on desktop,
 * strip on mobile. Sections declare themselves with <DeskSection>.
 */
export function DeskPage({
  kicker,
  title,
  lede,
  meta,
  actions,
  hero,
  sections,
  walkthrough,
  verified = true,
  quiet = false,
  children,
}: {
  kicker: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  /** below the lede: e.g. a link line */
  meta?: ReactNode;
  actions?: ReactNode;
  /** full-width content under the hero text, e.g. the Gate Clock */
  hero?: ReactNode;
  sections?: RailSection[];
  walkthrough?: { title: string; steps: WalkStep[] };
  verified?: boolean | string;
  quiet?: boolean;
  children: ReactNode;
}) {
  const verifiedDate = typeof verified === "string" ? verified : DESK_VERIFIED;
  return (
    <SiteShell>
      <main className={`desk-page ${quiet ? "desk-quiet" : ""}`.trim()}>
        <MobileStrip />
        {walkthrough ? <WalkSteps title={walkthrough.title} steps={walkthrough.steps} /> : null}
        <div className="desk-frame">
          <Rail sections={sections ?? []} />
          <div className="desk-content">
            <header className="desk-hero desk-hero-fade">
              <p className={`desk-kicker ${quiet ? "desk-kicker-quiet" : ""}`.trim()}>{kicker}</p>
              <h1 className="desk-h1 mt-5">{title}</h1>
              {lede ? <div className="desk-lede mt-7">{lede}</div> : null}
              {meta ? <div className="mt-5">{meta}</div> : null}
              {verified ? (
                <p className="desk-verified mt-6">
                  <span>
                    Last verified <time dateTime={verifiedDate}>{verifiedDate}</time>
                  </span>
                  <span aria-hidden>·</span>
                  <span>public documents only</span>
                  <span aria-hidden>·</span>
                  <span>UNKNOWN labelled</span>
                </p>
              ) : null}
              {actions ? <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div> : null}
              {hero ? <div className="mt-12">{hero}</div> : null}
            </header>
            {children}
          </div>
        </div>
        <RevealObserver />
      </main>
    </SiteShell>
  );
}

export function DeskSection({
  id,
  num,
  title,
  intro,
  children,
  className = "",
  wide = false,
}: {
  id: string;
  num?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <section id={id} className={`desk-section ${className}`.trim()}>
      {title ? (
        <div className={`desk-section-head ${wide ? "" : "desk-prose"}`.trim()}>
          {num ? <p className="desk-kicker">{num}</p> : null}
          <h2 className="desk-h2">{title}</h2>
          {intro ? <div className="desk-body mt-4">{intro}</div> : null}
        </div>
      ) : null}
      <div className={wide ? "" : "desk-prose"}>{children}</div>
    </section>
  );
}
