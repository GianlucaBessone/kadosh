import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FAF9F7",
};

export const metadata: Metadata = {
  title: "KADOSH",
  description: "Administrá con sabiduría. Aplicación de finanzas personales basada en principios bíblicos.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KADOSH",
  },
  formatDetection: {
    telephone: false,
  },
};

import { GlobalClientProvider } from '@/components/GlobalClientProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GlobalClientProvider>
          {children}
        </GlobalClientProvider>
      </body>
    </html>
  );
}
