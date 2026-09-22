import { CONTESTED_EXPORT, DESK_SOURCES } from "@/lib/desk";
import { LeadTakeaway, PrimarySource } from "./DeskChrome";
import { Receipts } from "./Receipts";
import { StatusPill } from "./StatusChip";
import { resolveContestedSlots } from "./contested";

/**
 * Two equal columns: start ~1.8¢ vs life-average ~7.4¢.
 * Sentence first, number second. Technical cites live in Receipts.
 */
export function ContestedRateStrip() {
  const cells = resolveContestedSlots();
  const { intro, kicker, lastVerified, bridge } = CONTESTED_EXPORT;

  return (
    <section id="contested" aria-label="Contested export rates" className="desk-contested">
      <div className="mb-5">
        <p className="desk-kicker">{kicker}</p>
        <h2 className="desk-h2 mt-3 max-w-[28ch]">Two public prices. Different measurements.</h2>
      </div>
      <div className="desk-contested-grid">
        {cells.map(({ slot, marker }) => {
          const primary = DESK_SOURCES[marker.sources[0]];
          const rest = marker.sources.slice(1).map((id) => DESK_SOURCES[id]);
          return (
            <article key={slot.id} id={marker.id} className="p-6 sm:p-8">
              <LeadTakeaway>{slot.kicker}.</LeadTakeaway>
              <p className="desk-rate mt-5">~{marker.value}</p>
              <p className="mt-2 desk-fact text-[var(--text-muted)]">{marker.unit}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StatusPill status={marker.status} />
                <span className="desk-fact text-[var(--text-muted)]">
                  Last verified {marker.lastVerified}
                </span>
              </div>
              {primary ? (
                <PrimarySource
                  source={{
                    ...primary,
                    label: primary.label.includes("—")
                      ? primary.label.split("—")[0].trim()
                      : primary.label,
                  }}
                />
              ) : null}
              <Receipts
                summary="Receipts — cites, Annex D, CPI"
                sources={rest}
              >
                <p>{marker.note.plain}</p>
                <p className="mt-3">{marker.note.technical}</p>
              </Receipts>
            </article>
          );
        })}
      </div>
      <p className="desk-measure mt-5">
        {intro.plain}
      </p>
      <Receipts
        summary="Receipts — why you cannot divide this into a locked industrial tariff"
        sources={bridge.sources.map((id) => DESK_SOURCES[id])}
      >
        <p>{intro.technical}</p>
        <p className="mt-3">
          Last verified {lastVerified}. {bridge.note.technical}
        </p>
      </Receipts>
    </section>
  );
}
