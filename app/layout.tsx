import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenPeople.ai - Human-centric AI platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPeople.ai — Human-centric AI for business",
    description:
      "Human-centric AI to help your team plan, execute, and stay aligned—across notes, workflows, email, and secure storage.",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
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

        {/* Favicon and icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#00FF88" />
        <meta name="msapplication-TileColor" content="#000000" />
      </head>
      <body className="antialiased">
        {/* Noise texture overlay */}
        <div className="noise" aria-hidden="true" />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
