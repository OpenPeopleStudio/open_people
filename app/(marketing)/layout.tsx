import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Open People — Keep firm power in Newfoundland and Labrador",
    template: "%s · Open People",
  },
  description:
    "Constituent voice for keeping Churchill Falls / Gull Island firm power in Newfoundland and Labrador for industry. Compute is a named use of that power, not the only story.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
