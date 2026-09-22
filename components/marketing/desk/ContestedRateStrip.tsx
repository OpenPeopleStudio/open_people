import { resolveContestedSlots } from "./contested";
import { StatusPill } from "./StatusChip";

/**
 * Equal-weight visual treatment for the contested export stories.
 * Figures come only from COST_MARKERS. Empty shells stay empty.
 * Full notes remain on the existing marker cards below — this is chrome.
 */
export function ContestedRateStrip() {
  const cells = resolveContestedSlots();

  return (
    <section aria-label="Contested export rates" className="desk-contested">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="desk-h2">Three stories. Same weight.</h2>
        <p className="desk-fact text-[var(--text-muted)]">Not locked PPAs</p>
      </div>
      <div className="desk-contested-grid">
        {cells.map(({ slot, marker }) => (
          <article key={slot.id} id={`contested-${slot.id}`} className="p-6 sm:p-8">
            <p className="desk-kicker">{slot.kicker}</p>
            {marker ? (
              <>
                <p className="desk-rate mt-6">
                  {marker.value}
                  {marker.unit ? <span className="desk-rate-unit">{marker.unit}</span> : null}
                </p>
                <div className="mt-5">
                  <StatusPill status={marker.status} />
                </div>
                <h3 className="mt-4 text-[15px] font-medium leading-snug tracking-[-0.01em] text-[var(--text-primary)]">
                  {marker.label}
                </h3>
                <p className="mt-3 desk-fact text-[var(--text-muted)]">
                  Last verified {marker.lastVerified}
                </p>
                <a
                  href={`#${marker.id}`}
                  className="mt-4 inline-block desk-fact text-[var(--plasma)] no-underline hover:underline"
                >
                  Full marker →
                </a>
              </>
            ) : (
              <>
                {/* TODO(contested-copy): wire when COST_MARKERS gains a life-average
                    marker (intended ~7.4¢). Parallel PR may land the copy.
                    Do not invent a ¢ figure in this shell. */}
                <p className="desk-rate mt-6" aria-label={`${slot.kicker} figure not sourced yet`}>
                  —
                </p>
                <p className="mt-2 desk-fact text-[var(--text-muted)]">¢/kWh · not sourced</p>
                <p className="mt-5 text-[13px] leading-relaxed text-[var(--text-muted)]">
                  Sourced {slot.kicker.toLowerCase()} figure is not on this desk yet. This card is
                  chrome only — the dash is not a rate.
                </p>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
