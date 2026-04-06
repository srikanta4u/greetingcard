import { BackToTop } from "@/app/components/BackToTop";
import { CookieBanner } from "@/app/components/CookieBanner";
import { ToastProvider } from "@/components/Toast";
import { AppHeader } from "@/components/layout/AppHeader";
import { PublicFooterGate } from "@/components/layout/PublicFooterGate";
import { RootNavGate } from "@/components/layout/RootNavGate";
import { SiteFooter } from "@/components/site-footer";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_URL || "https://greetingcard-sodw.vercel.app";

export const viewport: Viewport = {
  themeColor: "#7C3AED",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.json",
  appleWebApp: {
    title: "AutoCard",
    statusBarStyle: "default",
  },
  title: {
    default: "AutoCard | Send Beautiful Greeting Cards Automatically",
    template: "%s | AutoCard",
  },
  description:
    "AutoCard sends personalized greeting cards automatically — birthdays, anniversaries, and more. Never miss a moment that matters.",
  keywords: [
    "greeting cards",
    "automated greeting cards",
    "birthday cards",
    "anniversary cards",
    "personalized cards",
    "card marketplace",
    "scheduled cards",
    "AutoCard",
  ],
  openGraph: {
    title: "AutoCard | Send Beautiful Greeting Cards Automatically",
    description:
      "AutoCard sends personalized greeting cards automatically — birthdays, anniversaries, and more. Never miss a moment that matters.",
    url: siteUrl,
    siteName: "AutoCard",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoCard | Send Beautiful Greeting Cards Automatically",
    description:
      "Personalized greeting cards sent automatically. Birthdays, anniversaries, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body
        className={`${inter.className} flex min-h-full flex-col overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}
      >
        <ToastProvider>
          <RootNavGate>
            <AppHeader />
          </RootNavGate>
          {children}
          <PublicFooterGate>
            <SiteFooter />
          </PublicFooterGate>
          <CookieBanner />
          <BackToTop />
        </ToastProvider>
      </body>
    </html>
  );
}
