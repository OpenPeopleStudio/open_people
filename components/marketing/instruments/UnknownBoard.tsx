import Link from "next/link";
import { TRACKER_ITEMS } from "@/lib/desk";

/**
 * I2 — the Unknown Board. One giant numeral: how many things the public
 * text still does not say. Each one is a dashed slot linking to its row.
 */
export function UnknownBoard({ includeOpen = false }: { includeOpen?: boolean }) {
  const unknown = TRACKER_ITEMS.filter((i) => i.status === "unknown");
  const open = includeOpen ? TRACKER_ITEMS.filter((i) => i.status === "open") : [];

  return (
    <div className="unknown-board">
      <div>
        <p className="desk-num-xl" style={{ color: "var(--alert)" }} aria-hidden>
          {unknown.length}
        </p>
        <p className="desk-num-unit">
          things the public paper still does not say
        </p>
        <p className="sr-only">
          {unknown.length} items on the tracker are marked unknown.
        </p>
        {includeOpen ? (
          <p className="mt-6 desk-fact text-[var(--ink-3)]">
            plus {open.length} open items with a date attached
          </p>
        ) : null}
      </div>
      <ul className="unknown-slots" aria-label="Unknown items">
        {unknown.map((item) => (
          <li key={item.id}>
            <Link href={`/tracker#${item.id}`} className="unknown-slot">
              <span className="tag">Not published</span>
              <span className="t">{item.title}</span>
            </Link>
          </li>
        ))}
        {open.map((item) => (
          <li key={item.id}>
            <Link
              href={`/tracker#${item.id}`}
              className="unknown-slot"
              style={{ borderColor: "rgba(212,168,75,0.45)" }}
            >
              <span className="tag" style={{ color: "var(--amber)" }}>
                Open
              </span>
              <span className="t">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
