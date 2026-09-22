import type { Metadata } from "next";
import "./desk.css";
import { fontClassName } from "./fonts";

export const metadata: Metadata = {
  title: {
    default: "Open People — Keep firm power in Newfoundland and Labrador",
    template: "%s · Open People",
  },
  description:
    "Churchill River desk: what is signed, what is open, and what the public text still does not say about Churchill Falls / Gull Island firm power. Mining first. Compute is a separate page.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`desk-root ${fontClassName}`}>{children}</div>;
}
