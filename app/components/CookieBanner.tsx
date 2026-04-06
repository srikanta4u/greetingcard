"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "autocard-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== "accepted" && stored !== "declined") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  function decline() {
    try {
      localStorage.setItem(STORAGE_KEY, "declined");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-violet-200/80 bg-white/95 px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-violet-900/40 dark:bg-zinc-900/95"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          We use cookies to improve your experience on AutoCard.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={decline}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
