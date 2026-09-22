import type { DeskSourceId } from "./sources";

export type DeskStatus = "signed" | "framework" | "endorsed" | "open" | "unknown";

export type DeskVoice = {
  plain: string;
  technical: string;
};

export type DeskItem = {
  id: string;
  title: string;
  when: string;
  status: DeskStatus;
  lastVerified: string;
  body: DeskVoice;
  sources: DeskSourceId[];
  href?: string;
  hrefLabel?: string;
};
