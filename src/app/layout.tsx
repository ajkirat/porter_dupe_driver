import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/i18n";
import ConfigGate from "@/components/ConfigGate";
import RegisterSW from "@/components/RegisterSW";
import { APP_NAME, TAGLINE } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: TAGLINE,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-dvh">
        <LanguageProvider>
          <ConfigGate>{children}</ConfigGate>
        </LanguageProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
