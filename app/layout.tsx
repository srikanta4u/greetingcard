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

export const metadata: Metadata = {
  metadataBase: new URL("https://autocard.com"),
  title: {
    default: "AutoCard — Never miss a moment that matters",
    template: "%s | AutoCard",
  },
  description:
    "AutoCard sends beautiful, personalized greeting cards automatically. Browse creator designs, schedule cards for birthdays and anniversaries, and never miss an important moment.",
  keywords: [
    "greeting cards",
    "birthday cards",
    "anniversary cards",
    "automated cards",
    "personalized cards",
    "card marketplace",
  ],
  openGraph: {
    title: "AutoCard — Never miss a moment that matters",
    description: "Beautiful greeting cards, sent automatically.",
    url: "https://autocard.com",
    siteName: "AutoCard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoCard — Never miss a moment that matters",
    description: "Beautiful greeting cards, sent automatically.",
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
