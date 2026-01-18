import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenPeople.ai — AI-Powered Commerce Infrastructure",
  description:
    "Transform your retail business with AI-powered inventory management, intelligent chat, and predictive analytics. The modern platform for ambitious commerce brands.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
