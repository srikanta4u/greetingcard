import Link from "next/link";

const VIOLET = "#7c3aed";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-violet-100 via-violet-50 to-white px-4 py-20 sm:px-6 sm:py-28 dark:from-violet-950 dark:via-zinc-900 dark:to-zinc-950"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -20%, ${VIOLET}22, transparent), radial-gradient(ellipse 60% 50% at 100% 0%, ${VIOLET}18, transparent)`,
        }}
      >
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl sm:leading-tight dark:text-white">
            Never miss a moment that matters
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            AutoCard sends beautiful, personalized greeting cards automatically —
            so you&apos;re always there for the people you love.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/marketplace"
              className="inline-flex w-full min-w-[200px] items-center justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-violet-700 shadow-lg shadow-violet-900/10 ring-1 ring-violet-200/80 transition hover:bg-violet-50 sm:w-auto dark:bg-zinc-800 dark:text-violet-200 dark:ring-violet-800 dark:hover:bg-zinc-700"
            >
              Browse cards
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex w-full min-w-[200px] items-center justify-center rounded-xl bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/35 transition hover:bg-violet-500 sm:w-auto"
            >
              Start for free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-violet-100/80 bg-white px-4 py-20 sm:px-6 dark:border-violet-900/20 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Why AutoCard
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
            Thoughtful cards, zero stress — we handle the timing and delivery.
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <article className="rounded-2xl border border-violet-100 bg-violet-50/40 p-8 shadow-sm transition hover:border-violet-200 hover:shadow-md dark:border-violet-900/30 dark:bg-violet-950/20 dark:hover:border-violet-800">
              <div className="text-3xl" aria-hidden>
                🗓
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
                Set it and forget it
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Add your contacts and their birthdays. We&apos;ll remind you and
                send the card automatically — even while you sleep.
              </p>
            </article>
            <article className="rounded-2xl border border-violet-100 bg-white p-8 shadow-sm transition hover:border-violet-200 hover:shadow-md dark:border-violet-900/30 dark:bg-zinc-900 dark:hover:border-violet-800">
              <div className="text-3xl" aria-hidden>
                🎨
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
                Cards made by real creators
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Every design is created by an independent artist. Browse hundreds
                of unique cards for every occasion.
              </p>
            </article>
            <article className="rounded-2xl border border-violet-100 bg-violet-50/40 p-8 shadow-sm transition hover:border-violet-200 hover:shadow-md dark:border-violet-900/30 dark:bg-violet-950/20 dark:hover:border-violet-800">
              <div className="text-3xl" aria-hidden>
                ✍️
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
                Personal messages, every time
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Write your message once or let AI suggest the perfect words.
                Your card arrives handwritten-style.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-zinc-50 px-4 py-20 sm:px-6 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            How it works
          </h2>
          <ol className="mt-14 space-y-10">
            {[
              {
                step: "1",
                title: "Add your contacts & their important dates",
                body: "Birthdays, anniversaries, and milestones — all in one place.",
              },
              {
                step: "2",
                title: "Browse and pick a card design you love",
                body: "Choose from creator-made designs for every style and occasion.",
              },
              {
                step: "3",
                title: "We print, address, and mail it automatically",
                body: "Premium printing and delivery — you get the credit, we do the work.",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white shadow-lg shadow-violet-600/30">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-y border-violet-100/80 bg-white px-4 py-20 sm:px-6 dark:border-violet-900/20 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Simple pricing
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-8 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Free
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  Browse marketplace
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  Instant purchases
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  3 contacts
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-b from-violet-50 to-white p-8 shadow-lg shadow-violet-900/5 dark:border-violet-800 dark:from-violet-950/40 dark:to-zinc-900">
              <h3 className="text-lg font-bold text-violet-900 dark:text-violet-100">
                Pro
              </h3>
              <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                $10<span className="text-base font-medium text-zinc-500">/mo</span>
                <span className="mx-2 text-zinc-400">or</span>
                $85<span className="text-base font-medium text-zinc-500">/yr</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
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
                href="/pricing"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-500"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Creator CTA */}
      <section className="bg-gradient-to-br from-violet-600 to-violet-800 px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Are you an artist or designer?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-violet-100">
            Sell your greeting card designs on AutoCard. Earn 60% on every card
            sold.
          </p>
          <Link
            href="/creator/apply"
            className="mt-10 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-violet-700 shadow-lg transition hover:bg-violet-50"
          >
            Become a creator
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-violet-100 bg-zinc-50 px-4 py-12 dark:border-violet-900/20 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link
              href="/marketplace"
              className="transition hover:text-violet-700 dark:hover:text-violet-300"
            >
              Marketplace
            </Link>
            <Link
              href="/pricing"
              className="transition hover:text-violet-700 dark:hover:text-violet-300"
            >
              Pricing
            </Link>
            <Link
              href="/creator/apply"
              className="transition hover:text-violet-700 dark:hover:text-violet-300"
            >
              Creator signup
            </Link>
            <Link
              href="/auth/login"
              className="transition hover:text-violet-700 dark:hover:text-violet-300"
            >
              Login
            </Link>
          </nav>
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
            © 2026 AutoCard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
