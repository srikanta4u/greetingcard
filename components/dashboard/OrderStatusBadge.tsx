const STYLES: Record<
  string,
  { label: string; className: string }
> = {
  paid: {
    label: "Paid",
    className:
      "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  pending_payment: {
    label: "Pending payment",
    className:
      "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  },
  ready_to_print: {
    label: "Printing",
    className:
      "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200",
  },
  printing: {
    label: "Printing",
    className:
      "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200",
  },
  shipped: {
    label: "Shipped",
    className:
      "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
  },
  scheduled: {
    label: "Scheduled",
    className:
      "bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-200",
  },
  skipped_no_subscription: {
    label: "Skipped",
    className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
  },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const cfg = STYLES[key] ?? {
    label: status.replace(/_/g, " "),
    className:
      "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
