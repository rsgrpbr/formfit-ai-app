import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/providers/I18nProvider";
import PWASetup from "@/components/PWASetup";
import BottomNav from "@/components/BottomNav";
import ptMessages from "@/messages/pt.json";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "meMove",
  description: "Move yourself forward with AI-powered workouts",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon.ico', sizes: 'any' },
    ],
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/icons/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "meMove",
  },
};

export const viewport: Viewport = {
  themeColor: "#080B0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased`}
      >
        <I18nProvider initialLocale="pt" initialMessages={ptMessages}>
          <PWASetup />
          {children}
          <BottomNav />
          <Toaster
            theme="dark"
            position="bottom-center"
            toastOptions={{
              style: { background: '#111827', border: '1px solid #1f2937', color: '#f9fafb' },
            }}
          />
        </I18nProvider>
      </body>
    </html>
  );
}
