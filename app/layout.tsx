import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://openpeople.ai"),
  title: {
    default: "Open People — Churchill River / Labrador power desk",
    template: "%s · Open People",
  },
  description:
    "Horizon desk for Churchill Falls / Gull Island firm power in Newfoundland and Labrador. Mining first. Compute is a named use on a separate page — partners own the steel.",
  keywords: [
    "Labrador",
    "Newfoundland and Labrador",
    "Churchill Falls",
    "Labrador mining",
    "DCIA",
    "green hydro",
    "Open People",
    "in-province power",
    "firm power",
  ],
  openGraph: {
    title: "Open People — Keep firm power in Newfoundland and Labrador",
    description:
      "Horizon desk: keep firm Churchill Falls / Gull Island power in NL. Mining first. Compute is a separate page.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Open People — Keep firm power in Newfoundland and Labrador",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open People — Keep firm power in Newfoundland and Labrador",
    description:
      "Horizon desk: keep firm Churchill Falls / Gull Island power in NL. Mining first. Compute is a separate page.",
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
        {/* Favicon and icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#040404" />
        <meta name="msapplication-TileColor" content="#040404" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
