"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefundClaimActions({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(path: "approve" | "deny") {
    setLoading(path);
    setError(null);
    try {
      const res = await fetch(`/api/admin/refunds/${claimId}/${path}`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => post("approve")}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {loading === "approve" ? "…" : "Approve"}
      </button>
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => post("deny")}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {loading === "deny" ? "…" : "Deny"}
      </button>
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : null}
    </div>
  );
}
