import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

const VIOLET = "#7c3aed";

export const metadata: Metadata = {
  title: {
    absolute: "AutoCard — Automated Greeting Cards for Every Occasion",
  },
  description:
    "AutoCard sends personalized greeting cards automatically — birthdays, anniversaries, and more. Never miss a moment that matters.",
  openGraph: {
    title: "AutoCard — Automated Greeting Cards for Every Occasion",
    description:
      "Beautiful, personalized cards from independent creators — sent on your schedule so you never miss a moment that matters.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AutoCard — greeting cards sent automatically",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoCard — Automated Greeting Cards for Every Occasion",
    description:
      "Beautiful, personalized cards — sent automatically for birthdays, anniversaries, and more.",
    images: ["/og-image.png"],
  },
};

function HomeBelowFallback() {
  return (
    <div className="min-h-[40vh] animate-pulse bg-zinc-100/80 dark:bg-zinc-900/50" aria-hidden />
  );
}

async function HomeBelowFoldAsync() {
  const { default: HomeBelowFold } = await import("@/components/home/HomeBelowFold");
  return <HomeBelowFold />;
}

export default function HomePage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
      {/* Hero — above the fold */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-violet-100 via-violet-50 to-white px-4 py-16 sm:px-6 sm:py-28 dark:from-violet-950 dark:via-zinc-900 dark:to-zinc-950"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -20%, ${VIOLET}22, transparent), radial-gradient(ellipse 60% 50% at 100% 0%, ${VIOLET}18, transparent)`,
        }}
      >
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl sm:leading-tight md:text-5xl dark:text-white">
            Never miss a moment that matters
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:mt-6 sm:text-lg dark:text-zinc-400">
            AutoCard sends beautiful, personalized greeting cards automatically —
            so you&apos;re always there for the people you love.
          </p>
          <div className="mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mx-auto sm:mt-10 sm:max-w-none sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/marketplace"
              className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-lg shadow-violet-900/10 ring-1 ring-violet-200/80 transition hover:bg-violet-50 sm:w-auto sm:min-w-[200px] dark:bg-zinc-800 dark:text-violet-200 dark:ring-violet-800 dark:hover:bg-zinc-700"
            >
              Browse cards
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/35 transition hover:bg-violet-500 sm:w-auto sm:min-w-[200px]"
            >
              Start for free
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<HomeBelowFallback />}>
        <HomeBelowFoldAsync />
      </Suspense>
    </div>
  );
}
