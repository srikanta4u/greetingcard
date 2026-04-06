import { adminClient } from "@/lib/supabase/admin";
import { CreatorApplicationRowActions } from "./creator-application-row-actions";

function formatAppliedDate(iso: string | null) {
  if (!iso) return "—";
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

async function displayName(userId: string, email: string): Promise<string> {
  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  if (error || !data.user) {
    return email.split("@")[0] || "—";
  }
  const meta = data.user.user_metadata as { full_name?: string } | undefined;
  const n = meta?.full_name?.trim();
  return n || email.split("@")[0] || "—";
}

export default async function AdminCreatorsPage() {
  const { data: pendingRows, error: pendingErr } = await adminClient
    .from("creators")
    .select("id, user_id, portfolio_url, created_at")
    .eq("is_verified", false)
    .order("created_at", { ascending: false });

  if (pendingErr) {
    console.error("[admin/creators]", pendingErr);
  }

  const pending = (pendingRows ?? []) as {
    id: string;
    user_id: string;
    portfolio_url: string;
    created_at: string;
  }[];

  const pendingUserIds = new Set(pending.map((p) => p.user_id));

  const { data: orphanRoleRows } = await adminClient
    .from("users")
    .select("id, email")
    .eq("role", "pending_creator");

  const orphans = ((orphanRoleRows ?? []) as { id: string; email: string | null }[])
    .filter((u) => !pendingUserIds.has(u.id))
    .map((u) => ({
      user_id: u.id,
      email: u.email ?? "",
      portfolio_url: "",
      created_at: null as string | null,
    }));

  const rowsWithCreator = pending.map((p) => ({
    user_id: p.user_id,
    email: "" as string,
    portfolio_url: p.portfolio_url,
    created_at: p.created_at,
  }));

  const userIds = [
    ...new Set([
      ...rowsWithCreator.map((r) => r.user_id),
      ...orphans.map((o) => o.user_id),
    ]),
  ];

  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await adminClient
      .from("users")
      .select("id, email")
      .in("id", userIds);
    for (const u of users ?? []) {
      const row = u as { id: string; email: string | null };
      if (row.email) emailById.set(row.id, row.email);
    }
  }

  const merged = [
    ...rowsWithCreator.map((r) => ({
      ...r,
      email: emailById.get(r.user_id) ?? "",
      hasCreatorRow: true,
    })),
    ...orphans.map((o) => ({
      user_id: o.user_id,
      email: o.email || emailById.get(o.user_id) || "",
      portfolio_url: o.portfolio_url,
      created_at: o.created_at,
      creatorRowId: null as string | null,
      hasCreatorRow: false,
    })),
  ];

  const names = await Promise.all(
    merged.map((r) => displayName(r.user_id, r.email)),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Creator applications
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Review pending applications (
          <code className="text-xs">pending_creator</code> or unverified creator
          profile).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Portfolio URL</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {merged.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No pending creator applications.
                  </td>
                </tr>
              ) : (
                merged.map((row, i) => (
                  <tr key={row.user_id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {names[i]}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {row.email || "—"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3">
                      {row.portfolio_url ? (
                        <a
                          href={row.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
                        >
                          {row.portfolio_url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatAppliedDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CreatorApplicationRowActions
                        userId={row.user_id}
                        hasCreatorRow={row.hasCreatorRow}
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
