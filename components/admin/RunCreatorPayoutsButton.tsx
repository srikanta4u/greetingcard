"use client";

import { useState } from "react";

export function RunCreatorPayoutsButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts/run", { method: "POST" });
      const data = (await res.json()) as {
        processed?: number;
        skipped?: number;
        total_paid?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      const paid = Number(data.total_paid ?? 0);
      setMessage(
        `Processed ${data.processed ?? 0} creator(s), skipped ${data.skipped ?? 0} below minimum, total paid $${paid.toFixed(2)}.`,
      );
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
      >
        {loading ? "Running…" : "Run payouts now"}
      </button>
      {message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
