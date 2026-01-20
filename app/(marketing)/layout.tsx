import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenPeople.ai — Human-centric AI for business",
  description:
    "Human-centric AI to help your team plan, execute, and stay aligned—across notes, workflows, email, and secure storage. Your data stays safe, useful, and yours.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
