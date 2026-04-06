"use client";

import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminDesignRowActions({
  designId,
  status,
}: {
  designId: string;
  status: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<null | "approve" | "reject">(null);
  const [error, setError] = useState<string | null>(null);

  const canModerate = status === "pending";

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
        showToast(data.error ?? "Approve failed", "error");
        return;
      }
      setRejectOpen(false);
      setReason("");
      showToast("Design approved");
      router.refresh();
    } catch {
      setError("Network error");
      showToast("Network error", "error");
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
        showToast(data.error ?? "Reject failed", "error");
        return;
      }
      setRejectOpen(false);
      setReason("");
      showToast("Design rejected");
      router.refresh();
    } catch {
      setError("Network error");
      showToast("Network error", "error");
    } finally {
      setLoading(null);
    }
  }

  if (!canModerate) {
    return (
      <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error ? (
        <p className="max-w-[200px] text-right text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => void approve()}
          disabled={loading !== null}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === "approve" ? "…" : "Approve"}
        </button>
        {!rejectOpen ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setRejectOpen(true);
            }}
            disabled={loading !== null}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-200 dark:hover:bg-red-950/40"
          >
            Reject
          </button>
        ) : null}
      </div>
      {rejectOpen ? (
        <div className="mt-1 w-full max-w-xs rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left dark:border-zinc-700 dark:bg-zinc-950">
          <label
            htmlFor={`reject-${designId}`}
            className="block text-xs font-medium text-zinc-800 dark:text-zinc-200"
          >
            Reason
          </label>
          <textarea
            id={`reject-${designId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void reject()}
              disabled={loading !== null}
              className="rounded bg-red-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {loading === "reject" ? "…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                setReason("");
                setError(null);
              }}
              disabled={loading !== null}
              className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
