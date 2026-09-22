import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";

/**
 * Desk v2 type: Newsreader (editorial serif, optical sizes) for display,
 * Inter for body, JetBrains Mono for numerals, labels and citations.
 * Self-hosted by next/font — no render-blocking Google Fonts <link>.
 */
export const display = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

export const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-body",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const fontClassName = `${display.variable} ${body.variable} ${mono.variable}`;
