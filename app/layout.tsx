import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SiteJsonLd } from "@/components/marketing/SiteJsonLd";
import { HOME_DESCRIPTION, HOME_TITLE, DESK_OG_IMAGE, DESK_OG_IMAGE_PATH } from "@/lib/og/copy";
import { siteOrigin } from "@/lib/site";

export const viewport: Viewport = {
  themeColor: "#040404",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  applicationName: "Open People",
  title: {
    default: HOME_TITLE,
    template: "%s · Open People",
  },
  description: HOME_DESCRIPTION,
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
    "Gull Island",
  ],
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    type: "website",
    locale: "en_CA",
    siteName: "Open People",
    images: [
      {
        url: DESK_OG_IMAGE.url,
        width: DESK_OG_IMAGE.width,
        height: DESK_OG_IMAGE.height,
        alt: DESK_OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [DESK_OG_IMAGE_PATH],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  other: {
    "msapplication-TileColor": "#040404",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteJsonLd />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
