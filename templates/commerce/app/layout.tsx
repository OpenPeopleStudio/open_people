import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./globals-leaflet.css";
import { CartProvider } from "../context/CartContext";
import BottomNav from "../components/BottomNav";
import { getTenantFromRequest } from "../lib/tenant";
import { getThemeStyleVars } from "@/lib/theme";
import { TenantProvider } from "../context/TenantContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromRequest()
  const theme = tenant?.settings?.theme
  const hero = tenant?.settings?.content?.hero
  const brandName = theme?.brand_name || tenant?.name || 'Storefront'
  const description =
    hero?.subhead || "A modern marketplace with local delivery and pickup."

  return {
    title: `${brandName} | Marketplace`,
    description,
    icons: {
      icon: theme?.logo_url || '/favicon.ico',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: brandName,
    },
    formatDetection: {
      telephone: false,
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenantFromRequest()
  const themeStyle = getThemeStyleVars(tenant?.settings?.theme?.colors)

  return (
    <html lang="en" className="dark" data-tenant={tenant?.slug} style={themeStyle}>
      <body className={`${inter.variable} font-sans antialiased`} data-tenant-id={tenant?.id}>
        <TenantProvider tenant={tenant}>
          <CartProvider tenantId={tenant?.id || 'default'}>
            <div className="min-h-screen pb-16 md:pb-0">
              {children}
            </div>
            <BottomNav />
          </CartProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
