import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "../logout-button";
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
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              ← Dashboard
            </Link>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Upcoming cards
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Scheduled deliveries
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Cards we will print and ship ahead of each event.
        </p>
        <div className="mt-8">
          <UpcomingOrdersClient orders={orders} />
        </div>
      </main>
    </div>
  );
}
