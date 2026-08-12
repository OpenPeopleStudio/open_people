import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://openpeople.ai"),
  title: {
    default: "Open People — Labrador green electrons → sovereign AI compute",
    template: "%s · Open People",
  },
  description:
    "Open People catalyzes Labrador-linked AI compute offtake from Newfoundland and Labrador’s renewable power — demand aggregation and sovereignty software, not hyperscale steel.",
  keywords: [
    "Labrador",
    "Newfoundland and Labrador",
    "Churchill Falls",
    "sovereign AI",
    "data centre",
    "green hydro",
    "Open People",
    "compute offtake",
  ],
  openGraph: {
    title: "Open People — Labrador green electrons → sovereign AI compute",
    description:
      "Demand aggregation and sovereignty software for Labrador-linked AI compute. Partners own the steel.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Open People — Labrador green electrons → sovereign AI compute",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open People — Labrador green electrons → sovereign AI compute",
    description:
      "Demand aggregation and sovereignty software for Labrador-linked AI compute. Partners own the steel.",
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
        <meta name="theme-color" content="#e8893c" />
        <meta name="msapplication-TileColor" content="#040404" />
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
