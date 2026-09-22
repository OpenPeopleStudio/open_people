/** @vitest-environment jsdom */

import type { ReactElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Dual, VoiceModeProvider, VoiceToggle, resetVoiceModeStore } from "@/components/marketing/voice";
import { VOICE_STORAGE_KEY } from "@/lib/voice-mode";

afterEach(() => {
  cleanup();
  resetVoiceModeStore();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

function mount(ui: ReactElement) {
  return render(<VoiceModeProvider>{ui}</VoiceModeProvider>);
}

describe("voice mode chrome", () => {
  it("renders both Dual tracks and hides technical by default", () => {
    mount(
      <Dual
        plain={<span>Plain scale copy</span>}
        technical={<span>Technical receipt copy</span>}
      />
    );
    const plain = document.querySelector('[data-voice="plain"]');
    const technical = document.querySelector('[data-voice="technical"]');
    expect(plain?.hasAttribute("hidden")).toBe(false);
    expect(technical?.hasAttribute("hidden")).toBe(true);
    expect(plain?.textContent).toContain("Plain scale copy");
    expect(technical?.textContent).toContain("Technical receipt copy");
  });

  it("keeps exact segmented labels and persists technical after toggle", () => {
    mount(
      <>
        <VoiceToggle />
        <Dual plain={<span>plain-side</span>} technical={<span>tech-side</span>} />
      </>
    );

    const buttons = Array.from(document.querySelectorAll('[aria-label="Reading depth"] button'));
    expect(buttons.map((button) => button.textContent)).toEqual(["Plain", "Guided", "Technical"]);

    fireEvent.click(buttons[2]!);

    expect(window.localStorage.getItem(VOICE_STORAGE_KEY)).toBe("technical");
    expect(new URL(window.location.href).searchParams.get("v")).toBe("tech");
    expect(document.querySelector('[data-voice="plain"]')?.hasAttribute("hidden")).toBe(true);
    expect(document.querySelector('[data-voice="technical"]')?.hasAttribute("hidden")).toBe(false);
    expect(buttons[2]?.getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps plain visible in guided depth", () => {
    mount(
      <>
        <VoiceToggle />
        <Dual plain={<span>plain-side</span>} technical={<span>tech-side</span>} />
      </>
    );
    const buttons = Array.from(document.querySelectorAll('[aria-label="Reading depth"] button'));
    fireEvent.click(buttons[1]!);
    expect(window.localStorage.getItem(VOICE_STORAGE_KEY)).toBe("guided");
    expect(new URL(window.location.href).searchParams.get("v")).toBe("guided");
    expect(document.querySelector('[data-voice="plain"]')?.hasAttribute("hidden")).toBe(false);
  });

  it("honours ?v=tech once and writes storage", async () => {
    window.history.replaceState(null, "", "/engage?v=tech");
    mount(
      <Dual plain={<span>plain-side</span>} technical={<span>tech-side</span>} />
    );

    await waitFor(() => {
      expect(document.querySelector('[data-voice="technical"]')?.hasAttribute("hidden")).toBe(
        false
      );
    });
    expect(window.localStorage.getItem(VOICE_STORAGE_KEY)).toBe("technical");
  });
});
