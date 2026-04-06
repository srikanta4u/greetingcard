import { AuthenticatedTopNav } from "@/components/layout/AuthenticatedTopNav";
import { PublicMarketingNav } from "@/components/layout/PublicMarketingNav";
import { RootNavGate } from "@/components/layout/RootNavGate";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
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

const siteUrl =
  process.env.NEXT_PUBLIC_URL || "https://greetingcard-sodw.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasUser = Boolean(user);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <RootNavGate hasUser={hasUser}>
          {hasUser && user ? (
            <AuthenticatedTopNav email={user.email ?? ""} />
          ) : (
            <PublicMarketingNav />
          )}
        </RootNavGate>
        {children}
      </body>
    </html>
  );
}
