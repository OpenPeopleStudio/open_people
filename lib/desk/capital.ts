import { DESK_VERIFIED } from "./sources";
import type { DeskVoice } from "./types";

/** Funding stance. Capital unnamed. Nothing signed. */

export const CAPITAL_LAST_VERIFIED = DESK_VERIFIED;

export const CAPITAL_HERO: DeskVoice = {
  plain:
    "Capital is a proposed partner. No funder is named. Nothing is signed. Open People leads a proposed 500 MW Labrador AI campus and a research campus. Capital is unnamed here.",
  technical:
    "Partnership category: capital. That is a proposed structure, not a named funder and no signed commitment. Open People is the proponent of a proposed 500 MW Labrador AI campus and a research campus. Capital is unnamed here. None of that is a signed allocation or a named funder.",
};

export const CAPITAL_SECTIONS = [
  {
    id: "public",
    title: "What is public",
    body: {
      plain:
        "Open People is the proponent. Capital sits as a proposed partner category. We say that on the Capital track and on this page. Proposed. In feasibility. Not approved, not funded, not under construction.",
      technical:
        "Role: Open People leads. Capital is a proposed partner category on the public board. That is not a signed offtake and not a named funder. Status is only proposed / in feasibility.",
    } satisfies DeskVoice,
  },
  {
    id: "unpublished",
    title: "What is not published",
    body: {
      plain:
        "This page does not name a funder. It does not publish a funding ask. It does not publish budgets or money figures. When a figure or a named party is cleared, it lands on the Capital track as a new board entry.",
      technical:
        "No named funder. No funding ask. No budgets and no money figures on this page. A cleared figure or named party becomes a new Capital board entry with a cleared date. Until then, capital stays unnamed.",
    } satisfies DeskVoice,
  },
  {
    id: "enter",
    title: "How to enter",
    body: {
      plain:
        "Write to Tom Lane on the Capital track. Say who you are, and what you are offering or asking. The address is tom@openpeople.ai.",
      technical:
        "Capital track mail uses the subject Open People — Capital. Contact remains tom@openpeople.ai. This page is the funding stance record behind that track.",
    } satisfies DeskVoice,
  },
] as const;
