import { PricingPlanSection } from "@/components/pricing/PricingPlanSection";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free plan available. Upgrade to AutoCard Pro for $10/month to unlock automated scheduling and unlimited contacts.",
};

const FAQ = [
  {
    q: "When am I charged?",
    a: "Pro is billed at the start of each billing period (monthly or yearly). You won’t be charged for the Free plan. If you upgrade, your payment method is charged when you confirm — exact timing depends on how checkout is connected in your account.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel Pro whenever you like from your account. You’ll keep access through the end of the period you’ve already paid for, then your account moves back to Free features.",
  },
  {
    q: "How does scheduling work?",
    a: "Add contacts with birthdays or other dates, pick a design, and set when the card should send. AutoCard handles printing and mailing on your schedule so cards arrive on time without you rushing to the store.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <section className="border-b border-violet-100 bg-white px-4 py-16 dark:border-violet-900/30 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Pricing that fits how you send cards
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Start free, upgrade when you want unlimited contacts and automated
            sending.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <PricingPlanSection />
      </section>

      <section className="border-t border-violet-100 bg-white px-4 py-16 dark:border-violet-900/30 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-white">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-violet-100 bg-violet-50/30 open:bg-white dark:border-violet-900/30 dark:bg-violet-950/20 dark:open:bg-zinc-900"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left font-semibold text-zinc-900 marker:hidden dark:text-white [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="shrink-0 font-mono text-lg text-violet-600 group-open:hidden dark:text-violet-400">
                    +
                  </span>
                  <span className="hidden shrink-0 font-mono text-lg text-violet-600 group-open:inline dark:text-violet-400">
                    −
                  </span>
                </summary>
                <p className="border-t border-violet-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-zinc-600 dark:border-violet-900/30 dark:text-zinc-400">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="inline-flex w-full min-w-[200px] items-center justify-center rounded-xl border-2 border-violet-200 bg-white px-6 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 sm:w-auto dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-300 dark:hover:bg-violet-950/50"
            >
              Get started free
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex w-full min-w-[200px] items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 sm:w-auto"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
