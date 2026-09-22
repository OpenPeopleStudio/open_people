"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      className="walk-launch print:hidden"
      onClick={() => window.print()}
      aria-label="Print this page for your MHA"
    >
      <span aria-hidden>⎙</span>
      Print for your MHA
    </button>
  );
}
