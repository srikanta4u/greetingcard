"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminDesignActions({ designId }: { designId: string }) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<null | "approve" | "reject">(null);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setError(null);
    setLoading("approve");
    try {
      const res = await fetch(`/api/admin/designs/${designId}/approve`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Approve failed");
        return;
      }
      setRejectOpen(false);
      setReason("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  async function reject() {
    setError(null);
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please enter a rejection reason.");
      return;
    }
    setLoading("reject");
    try {
      const res = await fetch(`/api/admin/designs/${designId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmed }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Reject failed");
        return;
      }
      setRejectOpen(false);
      setReason("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void approve()}
          disabled={loading !== null}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {loading === "approve" ? "Approving…" : "Approve"}
        </button>
        {!rejectOpen ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setRejectOpen(true);
            }}
            disabled={loading !== null}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-200 dark:hover:bg-red-950/40"
          >
            Reject
          </button>
        ) : null}
      </div>

      {rejectOpen ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
          <label
            htmlFor={`reject-reason-${designId}`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Rejection reason
          </label>
          <textarea
            id={`reject-reason-${designId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this design was rejected…"
            className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void reject()}
              disabled={loading !== null}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-50"
            >
              {loading === "reject" ? "Submitting…" : "Confirm reject"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                setReason("");
                setError(null);
              }}
              disabled={loading !== null}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
