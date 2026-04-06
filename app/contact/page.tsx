import { ContactForm } from "@/app/contact/contact-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact AutoCard for support or questions.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
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
          Contact us
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Questions about AutoCard, your account, or creator applications?
          Send a message and we&apos;ll reply by email.
        </p>
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <ContactForm />
        </div>
      </main>
    </div>
  );
}
