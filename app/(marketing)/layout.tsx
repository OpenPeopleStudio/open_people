import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Open People — Keep firm power in Newfoundland and Labrador",
    template: "%s · Open People",
  },
  description:
    "Horizon desk for Churchill Falls / Gull Island firm power in Newfoundland and Labrador. Mining first. Compute is a separate page — not the opener.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
