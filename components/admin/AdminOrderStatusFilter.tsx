"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "paid", label: "Paid" },
  { value: "printing", label: "Printing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "scheduled", label: "Scheduled" },
  { value: "ready_to_print", label: "Ready to print" },
  { value: "print_failed", label: "Print failed" },
  { value: "skipped_no_subscription", label: "Skipped (no sub)" },
] as const;

export function AdminOrderStatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "";

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
      <span className="font-medium">Filter</span>
      <select
        value={current}
        onChange={(e) => {
          const v = e.target.value;
          const q = new URLSearchParams();
          if (v) q.set("status", v);
          const qs = q.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
      >
        {OPTIONS.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
