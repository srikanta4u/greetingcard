import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrdersTableClient } from "./OrdersTableClient";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function designTitleFromRow(row: {
  designs: { title: string } | null;
  personalization: unknown;
}): string {
  if (row.designs?.title) return row.designs.title;
  const p = row.personalization;
  if (p && typeof p === "object" && !Array.isArray(p)) {
    const t = (p as Record<string, unknown>).designTitle;
    if (typeof t === "string") return t;
  }
  return "Card";
}

function frontImageFromRow(row: {
  designs: { front_image_url: string } | null;
  personalization: unknown;
}): string | null {
  if (row.designs?.front_image_url) return row.designs.front_image_url;
  const p = row.personalization;
  if (p && typeof p === "object" && !Array.isArray(p)) {
    const u = (p as Record<string, unknown>).frontImageUrl;
    if (typeof u === "string") return u;
  }
  return null;
}

function trackingFromPersonalization(personalization: unknown): string | null {
  if (!personalization || typeof personalization !== "object") return null;
  const o = personalization as Record<string, unknown>;
  const t = o.tracking_number ?? o.trackingNumber;
  return typeof t === "string" && t.trim() ? t.trim() : null;
}

type OrderHistoryRow = {
  id: string;
  status: string;
  amount_charged: number | null;
  created_at: string | null;
  personalization: unknown;
  designs: { title: string; front_image_url: string } | null;
  contacts: { name: string } | null;
};

export default async function DashboardOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/orders");
  }

  const { data: rows, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      amount_charged,
      created_at,
      personalization,
      designs ( title, front_image_url ),
      contacts ( name )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dashboard/orders]", error);
  }

  const orders: OrderHistoryRow[] = (rows ?? []).map((raw) => {
    const row = raw as {
      id: string;
      status: string;
      amount_charged: number | null;
      created_at: string | null;
      personalization: unknown;
      designs:
        | { title: string; front_image_url: string }
        | { title: string; front_image_url: string }[]
        | null;
      contacts: { name: string } | { name: string }[] | null;
    };
    const d = one(row.designs);
    const c = one(row.contacts);
    return {
      id: row.id,
      status: row.status,
      amount_charged:
        typeof row.amount_charged === "number"
          ? row.amount_charged
          : row.amount_charged != null
            ? Number(row.amount_charged)
            : null,
      created_at: row.created_at,
      personalization: row.personalization,
      designs: d,
      contacts: c,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Order history
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Every instant and scheduled purchase tied to your account.
      </p>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No orders yet. Browse the marketplace!
          </p>
          <Link
            href="/marketplace"
            className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Go to marketplace
          </Link>
        </div>
      ) : (
        <OrdersTableClient
          orders={orders.map((o) => ({
            id: o.id,
            status: o.status,
            amountCharged: o.amount_charged,
            createdAt: o.created_at,
            designTitle: designTitleFromRow({
              designs: o.designs ? { title: o.designs.title } : null,
              personalization: o.personalization,
            }),
            frontImageUrl: frontImageFromRow({
              designs: o.designs
                ? { front_image_url: o.designs.front_image_url }
                : null,
              personalization: o.personalization,
            }),
            recipientName: o.contacts?.name ?? "—",
            trackingNumber: trackingFromPersonalization(o.personalization),
          }))}
        />
      )}
    </div>
  );
}
