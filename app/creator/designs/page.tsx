import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
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
  rejection_reason: string | null;
};

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

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
    .select("id, is_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  const pendingReview =
    creator != null &&
    (creator as { is_verified?: boolean | null }).is_verified === false;

  let designs: DesignRow[] = [];
  if (creator && !pendingReview) {
    const { data } = await supabase
      .from("designs")
      .select(
        "id, title, status, front_image_url, base_price, creator_markup, created_at, rejection_reason",
      )
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false });

    designs = (data ?? []) as DesignRow[];
  }

  const soldByDesign = new Map<string, number>();
  const earnedByDesign = new Map<string, number>();
  const pendingByDesign = new Map<string, number>();

  if (creator && !pendingReview && designs.length > 0) {
    const ids = designs.map((d) => d.id);
    const [soldRes, ledRes] = await Promise.all([
      adminClient
        .from("orders")
        .select("design_id")
        .in("design_id", ids)
        .in("status", ["shipped", "delivered"]),
      adminClient
        .from("creator_earnings_ledger")
        .select("design_id, amount, status")
        .eq("creator_id", creator.id)
        .in("design_id", ids),
    ]);

    for (const r of soldRes.data ?? []) {
      const did = (r as { design_id: string | null }).design_id;
      if (!did) continue;
      soldByDesign.set(did, (soldByDesign.get(did) ?? 0) + 1);
    }

    for (const r of ledRes.data ?? []) {
      const row = r as {
        design_id: string | null;
        amount: unknown;
        status: string;
      };
      if (!row.design_id) continue;
      if (row.status !== "reversed") {
        earnedByDesign.set(
          row.design_id,
          (earnedByDesign.get(row.design_id) ?? 0) + num(row.amount),
        );
      }
      if (row.status === "pending" || row.status === "eligible") {
        pendingByDesign.set(
          row.design_id,
          (pendingByDesign.get(row.design_id) ?? 0) + num(row.amount),
        );
      }
    }
  }

  if (pendingReview) {
    return (
      <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Creator
            </span>
            <Link
              href="/"
              className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              Home
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Application under review
          </h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-600 dark:text-zinc-400">
            Your creator application is being reviewed. You&apos;ll be able to
            upload designs after approval.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <nav className="flex gap-3 text-sm font-medium">
            <Link
              href="/creator/dashboard"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Dashboard
            </Link>
            <span className="text-violet-600 dark:text-violet-400">Designs</span>
          </nav>
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
              const totalSold = soldByDesign.get(d.id) ?? 0;
              const earningsTotal = earnedByDesign.get(d.id) ?? 0;
              const pendingAmt = pendingByDesign.get(d.id) ?? 0;
              return (
                <li
                  key={d.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-950">
                    <Image
                      src={d.front_image_url}
                      alt={d.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
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
                        <dt>Total sold</dt>
                        <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                          {totalSold}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Earnings (ledger)</dt>
                        <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatMoney(earningsTotal)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Pending in ledger</dt>
                        <dd className="font-medium tabular-nums text-amber-800 dark:text-amber-200/90">
                          {formatMoney(pendingAmt)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Buyer price</dt>
                        <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatMoney(buyerPays)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2 pt-1">
                        <dt>Created</dt>
                        <dd>{formatDate(d.created_at)}</dd>
                      </div>
                    </dl>
                    {d.status === "rejected" && d.rejection_reason ? (
                      <details className="mt-3 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-left text-sm dark:border-red-900/50 dark:bg-red-950/40">
                        <summary className="cursor-pointer font-medium text-red-900 dark:text-red-200">
                          Rejection reason
                        </summary>
                        <p className="mt-2 text-red-800 dark:text-red-100/90">
                          {d.rejection_reason}
                        </p>
                      </details>
                    ) : null}
                    <Link
                      href={`/creator/designs/${d.id}/edit`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    >
                      Edit
                    </Link>
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
