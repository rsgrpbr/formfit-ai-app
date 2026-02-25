import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/providers/I18nProvider";
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
          {children}
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
