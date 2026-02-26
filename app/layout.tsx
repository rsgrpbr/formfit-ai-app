import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "FormFit AI",
  description: "Seu personal trainer com IA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FormFit AI",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
