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
  title: {
    default: "AutoCard — Greeting cards, sent automatically",
    template: "%s · AutoCard",
  },
  description:
    "Beautiful, personalized greeting cards sent automatically. Never miss a birthday or milestone.",
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
