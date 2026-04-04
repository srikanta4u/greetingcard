"use client";

import Link from "next/link";
import { useState } from "react";

const BIO_MAX = 500;

export default function CreatorApplyPage() {
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedBio = bio.trim();
    if (!trimmedBio) {
      setError("Please enter your bio.");
      return;
    }
    if (trimmedBio.length > BIO_MAX) {
      setError(`Bio must be at most ${BIO_MAX} characters.`);
      return;
    }
    if (!rightsConfirmed) {
      setError("Please confirm you own full rights to your designs.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: trimmedBio,
          portfolio_url: portfolioUrl.trim() || undefined,
          rights_accepted: true,
        }),
      });
      const data = (await res.json()) as { error?: string; success?: boolean };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.success) {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-lg">
          <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
              <svg
                className="h-6 w-6 text-emerald-700 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Application submitted! We will review within 48 hours.
            </h1>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Thank you for applying to sell on AutoCard. We will email you when
              your application has been reviewed.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bioLen = bio.length;

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Creator application
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Tell us about yourself and your work. Our team reviews every
              application.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              >
                {error}
              </div>
            ) : null}

            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Bio <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    bioLen > BIO_MAX
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                  aria-live="polite"
                >
                  {bioLen} / {BIO_MAX}
                </span>
              </div>
              <textarea
                id="bio"
                name="bio"
                required
                maxLength={BIO_MAX}
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your background, style, and what buyers can expect from your cards."
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
              />
            </div>

            <div>
              <label
                htmlFor="portfolio_url"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Portfolio URL{" "}
                <span className="font-normal text-zinc-500 dark:text-zinc-400">
                  (optional)
                </span>
              </label>
              <input
                id="portfolio_url"
                name="portfolio_url"
                type="url"
                inputMode="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://"
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
              />
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
              <label className="flex cursor-pointer gap-3 text-sm text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={rightsConfirmed}
                  onChange={(e) => setRightsConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:ring-zinc-400"
                />
                <span>
                  I confirm I own full rights to all designs I will upload
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !rightsConfirmed || !bio.trim()}
              className="flex w-full justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
            >
              {loading ? "Submitting…" : "Submit application"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href="/"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Cancel and return home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
