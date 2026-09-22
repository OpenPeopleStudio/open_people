/** @vitest-environment jsdom */

import type { ReactElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Receipts } from "@/components/marketing/desk/Receipts";
import { VoiceModeProvider, VoiceToggle, resetVoiceModeStore } from "@/components/marketing/voice";

afterEach(() => {
  cleanup();
  resetVoiceModeStore();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

function mount(ui: ReactElement) {
  return render(<VoiceModeProvider>{ui}</VoiceModeProvider>);
}

describe("desk receipts", () => {
  it("starts closed in Plain and keeps the technical cite in the disclosure", () => {
    mount(
      <Receipts summary="Receipts — Annex D">
        <p>Annex D is target $B, not a locked industrial ¢.</p>
      </Receipts>,
    );
    const details = document.querySelector("details.desk-receipts");
    expect(details?.hasAttribute("open")).toBe(false);
    expect(details?.textContent).toContain("Annex D is target $B");
    expect(details?.querySelector("summary")?.textContent).toMatch(/Receipts/);
  });

  it("auto-opens in Technical voice", () => {
    mount(
      <>
        <VoiceToggle />
        <Receipts summary="Receipts — Annex D">
          <p>CPI deadband Annex F.</p>
        </Receipts>
      </>,
    );
    const buttons = Array.from(document.querySelectorAll('[aria-label="Reading depth"] button'));
    fireEvent.click(buttons[2]!);
    expect(document.querySelector("details.desk-receipts")?.hasAttribute("open")).toBe(true);
    expect(document.querySelector("details.desk-receipts")?.textContent).toContain("CPI deadband");
  });
});
