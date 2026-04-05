import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type DesignRow = {
  id: string;
  title: string;
  status: string;
  front_image_url: string;
  base_price: number;
  creator_markup: number;
  created_at: string;
};

function formatMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
    case "active":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
    case "rejected":
      return "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200";
    case "archived":
      return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
    default:
      return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
  }
}

export default async function CreatorDesignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/creator/designs");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let designs: DesignRow[] = [];
  if (creator) {
    const { data } = await supabase
      .from("designs")
      .select(
        "id, title, status, front_image_url, base_price, creator_markup, created_at",
      )
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false });

    designs = (data ?? []) as DesignRow[];
  }

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Your designs
          </span>
          <Link
            href="/"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Designs
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage artwork you&apos;ve uploaded for the marketplace.
            </p>
          </div>
          <Link
            href="/creator/designs/new"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Upload new design
          </Link>
        </div>

        {!creator ? (
          <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You need a creator profile before you can upload designs.
            </p>
            <Link
              href="/creator/apply"
              className="mt-4 inline-block text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Apply to become a creator
            </Link>
          </div>
        ) : designs.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You haven&apos;t uploaded any designs yet.
            </p>
            <Link
              href="/creator/designs/new"
              className="mt-6 inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Upload your first design
            </Link>
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {designs.map((d) => {
              const buyerPays = Number(d.base_price) + Number(d.creator_markup);
              const earnings = Number(d.creator_markup) * 0.6;
              return (
                <li
                  key={d.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote Supabase storage URL */}
                    <img
                      src={d.front_image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {d.title}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(d.status)}`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <dl className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="flex justify-between gap-2">
                        <dt>Buyer price</dt>
                        <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatMoney(buyerPays)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Your earnings</dt>
                        <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatMoney(earnings)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2 pt-1">
                        <dt>Created</dt>
                        <dd>{formatDate(d.created_at)}</dd>
                      </div>
                    </dl>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
