"use client";

import Link from "next/link";
import { useState } from "react";

const MONTHLY = 10;
const YEARLY = 85;
const YEARLY_EQ_MONTHLY = YEARLY / 12;

function Check({ included }: { included: boolean }) {
  return (
    <span
      className={
        included
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-zinc-300 dark:text-zinc-600"
      }
      aria-hidden
    >
      {included ? "✓" : "—"}
    </span>
  );
}

const ROWS: { label: string; free: boolean; pro: boolean; sub?: string }[] = [
  { label: "Browse marketplace", free: true, pro: true },
  { label: "Instant card purchases", free: true, pro: true },
  {
    label: "Saved contacts",
    sub: "Free includes up to 3 · Pro is unlimited",
    free: true,
    pro: true,
  },
  { label: "Automated scheduled sending", free: false, pro: true },
  { label: "Event & birthday reminders", free: false, pro: true },
  { label: "Priority support", free: false, pro: true },
];

export function PricingPlanSection() {
  const [yearly, setYearly] = useState(false);
  const proPrice = yearly ? YEARLY : MONTHLY;
  const proLabel = yearly ? "/year" : "/month";
  const savings =
    yearly && MONTHLY * 12 - YEARLY > 0
      ? Math.round(MONTHLY * 12 - YEARLY)
      : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Billing period
        </p>
        <div className="inline-flex rounded-full border border-violet-200 bg-white p-1 shadow-sm dark:border-violet-900/40 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              !yearly
                ? "bg-violet-600 text-white shadow-sm"
                : "text-zinc-600 hover:text-violet-700 dark:text-zinc-400 dark:hover:text-violet-300"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              yearly
                ? "bg-violet-600 text-white shadow-sm"
                : "text-zinc-600 hover:text-violet-700 dark:text-zinc-400 dark:hover:text-violet-300"
            }`}
          >
            Yearly
            {savings > 0 ? (
              <span className="ml-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Save ${savings}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {yearly ? (
        <p className="mt-3 text-center text-sm text-violet-700 dark:text-violet-300">
          ${YEARLY_EQ_MONTHLY.toFixed(2)}/mo billed annually — ${MONTHLY * 12}{" "}
          if paid monthly.
        </p>
      ) : (
        <p className="mt-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Switch to yearly and save compared to 12 × ${MONTHLY}.
        </p>
      )}

      <div className="mt-10 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-xl shadow-violet-900/5 dark:border-violet-900/30 dark:bg-zinc-900">
        <div className="grid gap-px bg-violet-100/80 dark:bg-violet-900/40 md:grid-cols-2">
          <div className="bg-white p-8 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Free
            </h2>
            <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              $0
              <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                {" "}
                forever
              </span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                Browse the full marketplace
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                Buy and send cards instantly
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                Up to 3 saved contacts
              </li>
            </ul>
            <Link
              href="/auth/signup"
              className="mt-8 flex w-full items-center justify-center rounded-xl border-2 border-violet-200 bg-white py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-300 dark:hover:bg-violet-950/50"
            >
              Get started free
            </Link>
          </div>

          <div className="relative bg-gradient-to-b from-violet-50 to-white p-8 dark:from-violet-950/40 dark:to-zinc-900">
            <span className="absolute right-6 top-6 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              Popular
            </span>
            <h2 className="text-lg font-bold text-violet-900 dark:text-violet-100">
              Pro
            </h2>
            <p className="mt-1 flex flex-wrap items-baseline gap-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              ${proPrice}
              <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                {proLabel}
              </span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                Everything in Free
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                Unlimited contacts
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                Automated scheduled sending
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                Event reminders
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                Priority support
              </li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-8 flex w-full items-center justify-center rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-violet-100 dark:border-violet-900/30">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-violet-100 bg-violet-50/50 dark:border-violet-900/30 dark:bg-violet-950/20">
                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
                  Feature
                </th>
                <th className="px-4 py-4 text-center font-semibold text-zinc-900 dark:text-white">
                  Free
                </th>
                <th className="px-4 py-4 text-center font-semibold text-violet-800 dark:text-violet-200">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100 dark:divide-violet-900/30">
              {ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="bg-white dark:bg-zinc-900/50"
                >
                  <td className="px-6 py-3.5 text-zinc-700 dark:text-zinc-300">
                    <span className="font-medium">{row.label}</span>
                    {row.sub ? (
                      <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                        {row.sub}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5 text-center text-lg">
                    <Check included={row.free} />
                  </td>
                  <td className="px-4 py-3.5 text-center text-lg">
                    <Check included={row.pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
