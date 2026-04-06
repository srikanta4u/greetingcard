import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-violet-100 bg-zinc-50 px-4 py-12 dark:border-violet-900/20 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-zinc-600 sm:justify-start dark:text-zinc-400">
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
            <Link
              href="/privacy"
              className="transition hover:text-violet-700 dark:hover:text-violet-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition hover:text-violet-700 dark:hover:text-violet-300"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="transition hover:text-violet-700 dark:hover:text-violet-300"
            >
              Contact
            </Link>
          </nav>
          <div className="flex flex-col items-center gap-4 sm:items-end">
            <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-violet-600 dark:hover:text-violet-400"
              >
                X (Twitter)
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-violet-600 dark:hover:text-violet-400"
              >
                Instagram
              </a>
            </div>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-500 sm:text-right">
              © 2026 AutoCard. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
