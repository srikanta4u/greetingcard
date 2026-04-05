"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";

const TITLE_MAX = 100;
const BASE_PRICE = 4.0;
const MARKUP_MIN = 0.5;
const MARKUP_MAX = 20;
const MARKUP_STEP = 0.5;
const DEFAULT_MARKUP = 2.0;

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Thank You",
  "Sympathy",
  "Holiday",
  "Congratulations",
  "Other",
] as const;
const TONES = [
  "Funny",
  "Heartfelt",
  "Formal",
  "Playful",
  "Romantic",
] as const;
const RECIPIENTS = [
  "Partner",
  "Friend",
  "Parent",
  "Child",
  "Colleague",
  "Anyone",
] as const;

function formatMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

export default function NewDesignPage() {
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [occasions, setOccasions] = useState<string[]>([]);
  const [tones, setTones] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [markup, setMarkup] = useState(DEFAULT_MARKUP);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const buyerPays = BASE_PRICE + markup;
  const earnings = markup * 0.6;

  const markupValid = useMemo(() => {
    const stepped = Math.round(markup / MARKUP_STEP) * MARKUP_STEP;
    return (
      Number.isFinite(markup) &&
      stepped >= MARKUP_MIN &&
      stepped <= MARKUP_MAX
    );
  }, [markup]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = title.trim();
    if (!trimmed) {
      setError("Please enter a title.");
      return;
    }
    if (trimmed.length > TITLE_MAX) {
      setError(`Title must be at most ${TITLE_MAX} characters.`);
      return;
    }
    if (!frontUrl) {
      setError("Please upload the front of the card.");
      return;
    }
    if (!markupValid) {
      setError(
        `Markup must be between ${formatMoney(MARKUP_MIN)} and ${formatMoney(MARKUP_MAX)} in ${MARKUP_STEP} steps.`,
      );
      return;
    }

    const steppedMarkup = Math.round(markup / MARKUP_STEP) * MARKUP_STEP;

    setLoading(true);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          tags_occasion: occasions,
          tags_tone: tones,
          tags_recipient: recipients,
          front_image_url: frontUrl,
          back_image_url: backUrl ?? undefined,
          creator_markup: steppedMarkup,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        success?: boolean;
      };

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
              Design submitted for review
            </h1>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              We&apos;ll notify you when your design has been reviewed.
            </p>
            <Link
              href="/creator/designs"
              className="mt-8 inline-block rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              View your designs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const titleLen = title.length;

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/creator/designs"
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Designs
          </Link>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            New design
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Upload a design
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add card artwork and details. Your design stays pending until our team
          approves it.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-10">
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            >
              {error}
            </div>
          ) : null}

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Card images
            </h2>
            <div className="mt-4 grid gap-8 md:grid-cols-2">
              <div>
                <ImageUpload
                  bucket="designs"
                  folder="front"
                  label="Front of card (required)"
                  onUpload={(url) => setFrontUrl(url)}
                />
              </div>
              <div>
                <ImageUpload
                  bucket="designs"
                  folder="back"
                  label="Back of card (optional)"
                  onUpload={(url) => setBackUrl(url)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Design details
            </h2>

            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Title{" "}
                  <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    titleLen > TITLE_MAX
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {titleLen} / {TITLE_MAX}
                </span>
              </div>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Watercolor birthday cake"
                className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
              />
            </div>

            <fieldset className="mt-8">
              <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Occasion
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {OCCASIONS.map((o) => (
                  <label
                    key={o}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <input
                      type="checkbox"
                      checked={occasions.includes(o)}
                      onChange={() =>
                        setOccasions((prev) => toggleInList(prev, o))
                      }
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Tone
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {TONES.map((t) => (
                  <label
                    key={t}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <input
                      type="checkbox"
                      checked={tones.includes(t)}
                      onChange={() => setTones((prev) => toggleInList(prev, t))}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Recipient
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {RECIPIENTS.map((r) => (
                  <label
                    key={r}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <input
                      type="checkbox"
                      checked={recipients.includes(r)}
                      onChange={() =>
                        setRecipients((prev) => toggleInList(prev, r))
                      }
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Pricing
            </h2>
            <div className="mt-6">
              <label
                htmlFor="creator_markup"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Your markup (added to $4.00 base)
              </label>
              <input
                id="creator_markup"
                name="creator_markup"
                type="number"
                min={MARKUP_MIN}
                max={MARKUP_MAX}
                step={MARKUP_STEP}
                value={markup}
                onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)}
                className="mt-2 block w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
              />
              <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Buyer pays:{" "}
                <span className="tabular-nums text-zinc-700 dark:text-zinc-200">
                  {formatMoney(buyerPays)}
                </span>
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Your earnings per card:{" "}
                <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatMoney(earnings)}
                </span>{" "}
                <span className="text-zinc-500">(60% of your markup)</span>
              </p>
            </div>
          </section>

          <button
            type="submit"
            disabled={
              loading || !frontUrl || !title.trim() || !markupValid
            }
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100 sm:w-auto sm:px-8"
          >
            {loading ? "Submitting…" : "Submit for review"}
          </button>
        </form>
      </main>
    </div>
  );
}
