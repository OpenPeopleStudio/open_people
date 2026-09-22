import type { Metadata } from "next";
import "./desk.css";
import { fontClassName } from "./fonts";
import { HOME_DESCRIPTION, HOME_TITLE } from "@/lib/og/copy";

export const metadata: Metadata = {
  title: {
    default: HOME_TITLE,
    template: "%s · Open People",
  },
  description: HOME_DESCRIPTION,
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`desk-root ${fontClassName}`}>{children}</div>;
}
