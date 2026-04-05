"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
] as const;

function chipClass(active: boolean) {
  return active
    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
    : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600";
}

export function FilterSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, val: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const occasion = searchParams.get("occasion") ?? "";
  const tone = searchParams.get("tone") ?? "";
  const recipient = searchParams.get("recipient") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  return (
    <div className="space-y-8">
      <div>
        <label
          htmlFor="marketplace-sort"
          className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
        >
          Sort
        </label>
        <select
          id="marketplace-sort"
          value={SORT_OPTIONS.some((o) => o.value === sort) ? sort : "newest"}
          onChange={(e) => {
            const v = e.target.value;
            updateParam("sort", v === "newest" ? null : v);
          }}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Occasion
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => {
            const active = occasion === o;
            return (
              <button
                key={o}
                type="button"
                onClick={() => updateParam("occasion", active ? null : o)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${chipClass(active)}`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Tone
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {TONES.map((t) => {
            const active = tone === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => updateParam("tone", active ? null : t)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${chipClass(active)}`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Recipient
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {RECIPIENTS.map((r) => {
            const active = recipient === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => updateParam("recipient", active ? null : r)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${chipClass(active)}`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
