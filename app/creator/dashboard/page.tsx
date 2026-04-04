import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/creator/dashboard");
  }

  const meta = user.user_metadata as { full_name?: string } | undefined;
  const nameFromMeta = meta?.full_name?.trim();
  const displayName = nameFromMeta || user.email || "Creator";
  const email = user.email ?? "—";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Creator
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Creator Dashboard - Coming Soon
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your designs and sales here once this area is live.
        </p>

        <dl className="mt-8 space-y-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Name
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              {displayName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Email
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              {email}
            </dd>
          </div>
        </dl>

        <Link
          href="/"
          className="mt-8 inline-flex text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          ← Back to homepage
        </Link>
      </main>
    </div>
  );
}
