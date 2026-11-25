import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/latin-400.css";
import "./globals.css";
import { t } from "@/lib/messages";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: t.appName,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
