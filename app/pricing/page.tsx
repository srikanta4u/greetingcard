import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        AutoCard Pro
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Subscribe to schedule cards for your contacts, unlimited address book,
        and more.
      </p>
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
        Complete checkout is configured in your Stripe dashboard; link your Pro
        plan here when ready.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
