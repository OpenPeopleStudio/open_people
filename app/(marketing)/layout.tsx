import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Open People — Labrador green electrons → sovereign AI compute",
    template: "%s · Open People",
  },
  description:
    "Open People catalyzes Labrador-linked AI compute offtake from Newfoundland and Labrador’s renewable power — demand aggregation and sovereignty software.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
