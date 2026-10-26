import { DESK_VERIFIED } from "./sources";
import type { DeskVoice } from "./types";

/** Partnership stance. Consent first. No agreement claimed. */

export const CONSENT_LAST_VERIFIED = DESK_VERIFIED;

export const CONSENT_HERO: DeskVoice = {
  plain:
    "Indigenous partnership comes first. No agreement is claimed. We intend to seek early, respectful engagement with each nation. Partnership, if any, is on terms each nation sets. No nation has been asked about this project.",
  technical:
    "Proposed partners include Indigenous nations, consent first. No impact-benefit agreement is signed. No meeting is claimed on this track. We intend to seek early, respectful engagement with each nation. No partnership or agreement exists. Partnership, if any, is on terms each nation sets. No nation has been asked about this project.",
};

export const CONSENT_SECTIONS = [
  {
    id: "claimed",
    title: "What is claimed",
    body: {
      plain:
        "Open People leads a proposed Labrador campus, in feasibility. Consent comes first. We intend early, respectful engagement. Any partnership is on terms each nation sets.",
      technical:
        "Public stance only: Open People is the proponent. Consent first. Intent to seek early, respectful engagement with each nation. Partnership, if any, on terms each nation sets. No signed partnership is claimed here.",
    } satisfies DeskVoice,
  },
  {
    id: "not-claimed",
    title: "What is not claimed",
    body: {
      plain:
        "No impact-benefit agreement is signed. No meeting is claimed on this track. No nation is named as a partner. No nation has been asked about this project.",
      technical:
        "No impact-benefit agreement. No meeting claimed. No nation named as a partner. No nation has been asked about this project. When a cleared external fact exists, it lands as a new Consent board entry with sources.",
    } satisfies DeskVoice,
  },
  {
    id: "ised",
    title: "Federal criteria are not our claim",
    body: {
      plain:
        "ISED lists Indigenous participation as one of its criteria. That is a federal criterion. Any role is for each nation to decide. It is not a claim that Open People has secured participation.",
      technical:
        "Home and Ottawa copy cite ISED Indigenous participation as a federal criterion for sovereign AI data-centre proposals. That sentence does not assert Open People participation, a partnership, or a signed role. Any role is for each nation to decide.",
    } satisfies DeskVoice,
  },
  {
    id: "enter",
    title: "How to enter",
    body: {
      plain:
        "Write to Tom Lane on the Consent track. Say who you are, and what you are offering or asking. The address is tom@openpeople.ai.",
      technical:
        "Consent track mail uses the subject Open People — Consent. Contact remains tom@openpeople.ai. This page is the partnership stance record behind that track.",
    } satisfies DeskVoice,
  },
] as const;
