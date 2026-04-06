import { SiteFooter } from "@/components/site-footer";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AutoCard collects, uses, and protects your information.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-semibold text-violet-700 dark:text-violet-300"
          >
            AutoCard
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: April 4, 2026
        </p>

        <div className="mt-10 max-w-none space-y-4 text-zinc-600 dark:text-zinc-400">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Data collection
          </h2>
          <p className="leading-relaxed">
            We collect information you provide when you create an account, place
            an order, upload designs as a creator, or contact us. This may
            include your name, email address, shipping address, payment-related
            metadata (processed by our payment provider), and messages you send
            to support.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            How we use data
          </h2>
          <p className="leading-relaxed">
            We use your information to operate the AutoCard service: to
            authenticate you, fulfill greeting card orders, pay creators,
            communicate about your account or orders, improve the product, and
            comply with legal obligations. We do not sell your personal
            information.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Cookies
          </h2>
          <p className="leading-relaxed">
            We use cookies and similar technologies to keep you signed in,
            remember preferences, and understand how the site is used. You can
            control cookies through your browser settings. Essential cookies are
            required for core functionality such as authentication.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Third-party services
          </h2>
          <p className="leading-relaxed">
            AutoCard relies on trusted providers:{" "}
            <strong>Stripe</strong> for payments and payouts,{" "}
            <strong>Supabase</strong> for authentication, database, and file
            storage, and <strong>Resend</strong> for transactional email. Each
            provider processes data according to their own privacy policies and
            our agreements with them.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Contact
          </h2>
          <p className="leading-relaxed">
            For privacy-related questions, reach us through the{" "}
            <Link
              href="/contact"
              className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
            >
              contact page
            </Link>
            .
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
