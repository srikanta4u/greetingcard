import { adminClient } from "@/lib/supabase/admin";
import Image from "next/image";
import Link from "next/link";
import { AdminDesignRowActions } from "./admin-design-row-actions";

type StatusFilter = "all" | "pending" | "active" | "rejected";

const TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Rejected", value: "rejected" },
];

export default async function AdminDesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const raw = sp.status ?? "pending";
  const filter: StatusFilter = TABS.some((t) => t.value === raw)
    ? (raw as StatusFilter)
    : "pending";

  let query = adminClient
    .from("designs")
    .select(
      "id, title, status, created_at, front_image_url, rejection_reason, creator_id",
    )
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data: designRows, error } = await query;

  if (error) {
    console.error("[admin/designs]", error);
  }

  const designs = (designRows ?? []) as {
    id: string;
    title: string;
    status: string;
    created_at: string;
    front_image_url: string;
    rejection_reason: string | null;
    creator_id: string | null;
  }[];

  const creatorIds = [
    ...new Set(designs.map((d) => d.creator_id).filter(Boolean)),
  ] as string[];

  const creatorById = new Map<string, { user_id: string }>();
  if (creatorIds.length > 0) {
    const { data: creators } = await adminClient
      .from("creators")
      .select("id, user_id")
      .in("id", creatorIds);
    for (const c of creators ?? []) {
      const row = c as { id: string; user_id: string };
      creatorById.set(row.id, { user_id: row.user_id });
    }
  }

  const userIds = [
    ...new Set([...creatorById.values()].map((c) => c.user_id)),
  ];
  const emailByUserId = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await adminClient
      .from("users")
      .select("id, email")
      .in("id", userIds);
    for (const u of users ?? []) {
      const row = u as { id: string; email: string | null };
      if (row.email) emailByUserId.set(row.id, row.email);
    }
  }

  function creatorEmail(row: (typeof designs)[0]): string {
    if (!row.creator_id) return "—";
    const c = creatorById.get(row.creator_id);
    if (!c) return "—";
    return emailByUserId.get(c.user_id) ?? "—";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Design moderation
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Approve or reject designs before they appear in the marketplace.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-1 dark:border-zinc-800">
        {TABS.map((tab) => {
          const active = filter === tab.value;
          const href =
            tab.value === "pending"
              ? "/admin/designs"
              : `/admin/designs?status=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={
                active
                  ? "rounded-t-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  : "rounded-t-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Creator</th>
                <th className="hidden px-4 py-3 sm:table-cell">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {designs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No designs in this view.
                  </td>
                </tr>
              ) : (
                designs.map((d) => (
                  <tr key={d.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="relative h-14 w-11 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                        <Image
                          src={d.front_image_url}
                          alt=""
                          width={44}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="max-w-[200px] px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {d.title}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {creatorEmail(d)}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400 sm:table-cell">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminDesignRowActions
                        designId={d.id}
                        status={d.status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
