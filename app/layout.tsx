import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenPeople.ai — AI-Powered Commerce Infrastructure",
  description:
    "Transform your retail business with AI-powered inventory management, intelligent chat, and predictive analytics. The modern platform for ambitious commerce brands.",
  keywords: [
    "AI commerce",
    "inventory management",
    "retail AI",
    "e-commerce platform",
    "multi-tenant",
    "SaaS",
  ],
  openGraph: {
    title: "OpenPeople.ai — AI-Powered Commerce Infrastructure",
    description:
      "Transform your retail business with AI-powered inventory management, intelligent chat, and predictive analytics.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPeople.ai — AI-Powered Commerce Infrastructure",
    description:
      "Transform your retail business with AI-powered inventory management, intelligent chat, and predictive analytics.",
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
        {/* Instrument Serif for display headings */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
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
