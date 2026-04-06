import type {
  DashboardHomeRecentOrder,
  DashboardHomeUpcomingEvent,
} from "@/components/dashboard/DashboardHomeClient";
import dynamic from "next/dynamic";

const DashboardHomeClient = dynamic(
  () =>
    import("@/components/dashboard/DashboardHomeClient").then((m) => ({
      default: m.DashboardHomeClient,
    })),
  {
    loading: () => <DashboardHomeLoading />,
  },
);

function DashboardHomeLoading() {
  return (
    <div className="space-y-10">
      <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
import {
  getUpcomingEventsInWindow,
  type ContactWithEventsInput,
} from "@/lib/dashboard/upcomingEvents";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard");
  }

  const meta = user.user_metadata as { full_name?: string } | undefined;
  const displayName =
    meta?.full_name?.trim() || user.email?.split("@")[0] || "there";

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_active")
    .eq("id", user.id)
    .maybeSingle();

  const subscriptionActive = Boolean(profile?.subscription_active);

  const { data: contactRows, error: contactsErr } = await supabase
    .from("contacts")
    .select(
      `
      id,
      name,
      contact_events (
        id,
        event_type,
        event_date,
        recurs_annually
      )
    `,
    )
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (contactsErr) {
    console.error("[dashboard] contacts", contactsErr);
  }

  const upcomingWindow = getUpcomingEventsInWindow(
    (contactRows ?? []) as ContactWithEventsInput[],
    30,
  );

  const upcomingEvents: DashboardHomeUpcomingEvent[] = upcomingWindow.map(
    (e) => ({
      contactId: e.contactId,
      contactName: e.contactName,
      eventId: e.eventId,
      eventType: e.eventType,
      occurrenceYmd: e.occurrenceYmd,
      daysUntil: e.daysUntil,
    }),
  );

  const { count: scheduledCount, error: schedErr } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "scheduled");

  if (schedErr) {
    console.error("[dashboard] scheduled count", schedErr);
  }

  const { count: totalOrdersCount, error: totalErr } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (totalErr) {
    console.error("[dashboard] total orders", totalErr);
  }

  const { data: recentRows, error: recentErr } = await supabase
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
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentErr) {
    console.error("[dashboard] recent orders", recentErr);
  }

  const recentOrders: DashboardHomeRecentOrder[] = (recentRows ?? []).map(
    (raw) => {
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
        contacts: unknown;
      };
      const d = one(row.designs);
      return {
        id: row.id,
        status: row.status,
        amountCharged:
          typeof row.amount_charged === "number"
            ? row.amount_charged
            : row.amount_charged != null
              ? Number(row.amount_charged)
              : null,
        createdAt: row.created_at,
        designTitle: designTitleFromRow({
          designs: d ? { title: d.title } : null,
          personalization: row.personalization,
        }),
        frontImageUrl: frontImageFromRow({
          designs: d ? { front_image_url: d.front_image_url } : null,
          personalization: row.personalization,
        }),
      };
    },
  );

  return (
    <DashboardHomeClient
      displayName={displayName}
      subscriptionActive={subscriptionActive}
      upcomingEventsCount={upcomingEvents.length}
      scheduledPendingCount={scheduledCount ?? 0}
      totalOrdersCount={totalOrdersCount ?? 0}
      upcomingEvents={upcomingEvents}
      recentOrders={recentOrders}
    />
  );
}
