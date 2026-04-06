import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of AutoCard.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
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
            href="/marketplace"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            Marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: April 4, 2026
        </p>

        <div className="mt-10 max-w-none space-y-4 text-zinc-600 dark:text-zinc-400">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Acceptance
          </h2>
          <p className="leading-relaxed">
            By accessing or using AutoCard, you agree to these Terms. If you do
            not agree, do not use the service. We may update these Terms from
            time to time; continued use after changes constitutes acceptance.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Services
          </h2>
          <p className="leading-relaxed">
            AutoCard provides a marketplace for greeting card designs and tools
            to schedule and send physical cards. Features may change; we aim to
            give reasonable notice of material changes when practical.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Creator terms
          </h2>
          <p className="leading-relaxed">
            Creators must provide accurate information, own or have rights to
            upload their designs, and comply with our content guidelines.
            Earnings and payouts are subject to successful orders, platform
            fees, and payout schedules described in the product and creator
            documentation.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Buyer terms
          </h2>
          <p className="leading-relaxed">
            Buyers are responsible for accurate shipping addresses and timely
            payment. Card fulfillment depends on print partners; delivery
            estimates are not guarantees. You agree not to misuse the service or
            interfere with other users.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Payments
          </h2>
          <p className="leading-relaxed">
            Payments are processed by Stripe. You authorize charges for orders you
            place. Creator payouts are handled according to our payout process
            and applicable laws. Taxes may apply as shown at checkout where
            supported.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Refunds
          </h2>
          <p className="leading-relaxed">
            Refund eligibility depends on order status, print production, and
            our refund policy. Contact support through the{" "}
            <Link
              href="/contact"
              className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
            >
              contact page
            </Link>{" "}
            for assistance with a specific order.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Termination
          </h2>
          <p className="leading-relaxed">
            You may stop using AutoCard at any time. We may suspend or terminate
            access for violations of these Terms, fraud, or risk to the platform
            or other users. Provisions that by nature should survive will
            survive termination.
          </p>
        </div>
      </main>
    </div>
  );
}
