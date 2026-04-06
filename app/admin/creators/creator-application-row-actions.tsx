"use client";

import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreatorApplicationRowActions({
  userId,
  hasCreatorRow,
}: {
  userId: string;
  hasCreatorRow: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function approve() {
    if (!hasCreatorRow) {
      showToast("Cannot approve — missing creator record. Reject or contact support.", "error");
      return;
    }
    setLoading("approve");
    try {
      const res = await fetch(`/api/admin/creators/${userId}/approve`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(data.error ?? "Could not approve", "error");
        return;
      }
      showToast("Creator approved.", "success");
      router.refresh();
    } catch {
      showToast("Request failed", "error");
    } finally {
      setLoading(null);
    }
  }

  async function reject() {
    setLoading("reject");
    try {
      const res = await fetch(`/api/admin/creators/${userId}/reject`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(data.error ?? "Could not reject", "error");
        return;
      }
      showToast("Application rejected.", "success");
      router.refresh();
    } catch {
      showToast("Request failed", "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={loading !== null || !hasCreatorRow}
        onClick={approve}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "approve" ? "…" : "Approve"}
      </button>
      <button
        type="button"
        disabled={loading !== null}
        onClick={reject}
        className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-200 dark:hover:bg-red-950/40"
      >
        {loading === "reject" ? "…" : "Reject"}
      </button>
    </div>
  );
}
