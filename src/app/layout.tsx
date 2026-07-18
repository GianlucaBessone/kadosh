import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FAF9F7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Eliminando 'display' porque no es una propiedad válida en Viewport
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
  // Asegurar que la aplicación pueda funcionar offline
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'KADOSH',
    'application-name': 'KADOSH',
  }
};

import { GlobalClientProvider } from '@/components/GlobalClientProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <GlobalClientProvider>
          {children}
        </GlobalClientProvider>
      </body>
    </html>
  );
}