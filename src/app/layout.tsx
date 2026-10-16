import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { cookies } from "next/headers";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { default: "Noor ul Ilm — نور العلم", template: "%s · Noor ul Ilm" },
  description:
    "Noor ul Ilm: Quran, Hadith, Azkaar, prayer times and Islamic books, based only on the Quran and Sunnah.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  openGraph: {
    title: "Noor ul Ilm — نور العلم",
    description: "Quran, Hadith, Azkaar, prayer times and Islamic books, based only on the Quran and Sunnah.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Noor ul Ilm — Light of Islam" }],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#0f5c46",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const lang = store.get("noor-lang")?.value === "ur" ? "ur" : "en";
  const theme = store.get("noor-theme")?.value;
  const dataTheme =
    theme === "light" || theme === "dark" || theme === "sepia" ? theme : undefined;

  return (
    <html lang={lang} dir={lang === "ur" ? "rtl" : "ltr"} data-theme={dataTheme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Inter:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@400;500;600&display=swap"
        />
      </head>
      <body>
       <I18nProvider initialLang={lang}>
       {children}
       <SiteFooter />
       </I18nProvider>
      </body>
    </html>
  );
}
