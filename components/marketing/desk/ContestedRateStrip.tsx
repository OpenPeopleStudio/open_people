import { CONTESTED_EXPORT, DESK_SOURCES } from "@/lib/desk";
import { Figure, Unfold } from "@/components/marketing/depth";
import { StatusPill } from "./StatusChip";
import { resolveContestedSlots } from "./contested";

/**
 * Two equal columns: start ~1.8¢ vs life-average ~7.4¢.
 * Sentence first, number second. Technical cites fold underneath.
 */
export function ContestedRateStrip() {
  const cells = resolveContestedSlots();
  const { intro, kicker, lastVerified, bridge } = CONTESTED_EXPORT;

  return (
    <section id="contested" aria-label="Contested export rates" className="desk-contested">
      <div className="mb-6">
        <p className="desk-kicker">{kicker}</p>
        <h2 className="desk-h2 mt-3 max-w-[28ch]">Two public prices. Different measurements.</h2>
      </div>
      <div className="desk-grid-hair md:grid-cols-2">
        {cells.map(({ slot, marker }) => (
          <article key={slot.id} id={marker.id} className="p-6 sm:p-8">
            <p className="desk-takeaway">{slot.kicker}.</p>
            <div className="mt-5">
              <Figure
                value={`~${marker.value}`}
                unit={marker.unit}
                status={marker.status}
                size="lg"
                sources={marker.sources.map((id) => DESK_SOURCES[id])}
                lastVerified={marker.lastVerified}
                note={marker.note.plain}
              />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StatusPill status={marker.status} />
              <span className="desk-fact text-[var(--ink-3)]">Last verified {marker.lastVerified}</span>
            </div>
            <Unfold
              id={`contested-${slot.id}`}
              className="mt-4"
              label={`${marker.value}¢`}
              plain={<p className="desk-measure">{marker.note.plain}</p>}
              technical={marker.note.technical}
              sources={marker.sources.map((id) => DESK_SOURCES[id])}
            />
          </article>
        ))}
      </div>
      <div className="mt-6">
        <Unfold
          id="contested-bridge"
          label="the bridge"
          plain={<p className="desk-measure">{intro.plain} {bridge.note.plain}</p>}
          technical={
            <>
              <p>{intro.technical}</p>
              <p>
                Last verified {lastVerified}. {bridge.note.technical}
              </p>
            </>
          }
          sources={bridge.sources.map((id) => DESK_SOURCES[id])}
        />
      </div>
    </section>
  );
}
