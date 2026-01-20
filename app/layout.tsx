import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://openpeople.ai"),
  title: "OpenPeople.ai — Human-centric AI for business",
  description:
    "Human-centric AI to help your team plan, execute, and stay aligned—across notes, workflows, email, and secure storage. Your data stays safe, useful, and yours.",
  keywords: [
    "human-centric AI",
    "AI team",
    "AI workers",
    "workflows",
    "notes",
    "email",
    "secure storage",
    "multi-tenant",
    "multi-tenant",
    "SaaS",
  ],
  openGraph: {
    title: "OpenPeople.ai — Human-centric AI for business",
    description:
      "Human-centric AI to help your team plan, execute, and stay aligned—across notes, workflows, email, and secure storage.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "OpenPeople.ai — Human-centric AI for business",
    description:
      "Human-centric AI to help your team plan, execute, and stay aligned—across notes, workflows, email, and secure storage.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inter font for clean, modern typography */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {/* Noise texture overlay */}
        <div className="noise" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
