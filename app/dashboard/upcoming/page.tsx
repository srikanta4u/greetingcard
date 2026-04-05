import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  UpcomingOrdersClient,
  type UpcomingOrderRow,
} from "./UpcomingOrdersClient";

export default async function UpcomingOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/upcoming");
  }

  const { data: rows, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      scheduled_send_date,
      personalization,
      status,
      designs ( front_image_url, title ),
      contacts ( name )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .order("scheduled_send_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[dashboard/upcoming]", error);
  }

  function one<T>(v: T | T[] | null | undefined): T | null {
    if (v == null) return null;
    return Array.isArray(v) ? (v[0] ?? null) : v;
  }

  const orders: UpcomingOrderRow[] = (rows ?? []).map((r) => {
    const row = r as {
      id: string;
      scheduled_send_date: string | null;
      personalization: unknown;
      status: string;
      designs:
        | { front_image_url: string; title: string }
        | { front_image_url: string; title: string }[]
        | null;
      contacts: { name: string } | { name: string }[] | null;
    };
    return {
      id: row.id,
      scheduled_send_date: row.scheduled_send_date,
      personalization: row.personalization,
      status: row.status,
      designs: one(row.designs),
      contacts: one(row.contacts),
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Upcoming scheduled cards
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Cards we will print and ship ahead of each event.
      </p>
      <div className="mt-8">
        <UpcomingOrdersClient orders={orders} />
      </div>
    </div>
  );
}
