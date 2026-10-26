import { DM_Mono, Schibsted_Grotesk } from "next/font/google";

/**
 * Open People brand book.
 * Schibsted Grotesk — display and text (semibold headings, regular body).
 * DM Mono — labels and identifiers (medium for labels, regular for figures).
 * Self-hosted by next/font. Alias both roles to --font-grotesk in desk.css.
 */
export const grotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-grotesk",
});

export const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const fontClassName = `${grotesk.variable} ${mono.variable}`;
