"use client";

import { OptimizedImage } from "@/app/components/OptimizedImage";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";

export type OrderTableRow = {
  id: string;
  status: string;
  amountCharged: number | null;
  createdAt: string | null;
  designTitle: string;
  frontImageUrl: string | null;
  recipientName: string;
  trackingNumber: string | null;
};

function formatMoney(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function OrdersTableClient({ orders }: { orders: OrderTableRow[] }) {
  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
        <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3" scope="col">
              Card
            </th>
            <th className="hidden px-4 py-3 sm:table-cell" scope="col">
              Recipient
            </th>
            <th className="px-4 py-3" scope="col">
              Status
            </th>
            <th className="hidden px-4 py-3 md:table-cell" scope="col">
              Date
            </th>
            <th className="px-4 py-3" scope="col">
              Amount
            </th>
            <th className="px-4 py-3" scope="col">
              {" "}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {orders.map((o, idx) => {
            const shipped =
              o.status.toLowerCase() === "shipped" ||
              o.status.toLowerCase() === "delivered";
            return (
              <tr key={o.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="flex gap-3">
                    {o.frontImageUrl ? (
                      <OptimizedImage
                        src={o.frontImageUrl}
                        alt={o.designTitle}
                        fill={false}
                        width={40}
                        height={56}
                        priority={idx === 0}
                        sizes="40px"
                        className="rounded-md object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                        containerClassName="shrink-0 !block overflow-hidden rounded-md"
                      />
                    ) : (
                      <div className="h-14 w-10 shrink-0 rounded-md bg-zinc-100 dark:bg-zinc-800" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {o.designTitle}
                      </p>
                      {shipped && o.trackingNumber ? (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Tracking:{" "}
                          <span className="font-mono text-zinc-700 dark:text-zinc-300">
                            {o.trackingNumber}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-4 text-zinc-700 dark:text-zinc-300 sm:table-cell">
                  {o.recipientName}
                </td>
                <td className="px-4 py-4">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="hidden px-4 py-4 text-zinc-600 dark:text-zinc-400 md:table-cell">
                  {formatDate(o.createdAt)}
                </td>
                <td className="px-4 py-4 font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatMoney(o.amountCharged)}
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() =>
                      window.alert("Feature coming soon")
                    }
                    className="whitespace-nowrap text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                  >
                    Report an issue
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
