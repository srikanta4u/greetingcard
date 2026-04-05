import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const meta = user.user_metadata as { full_name?: string } | undefined;
  const nameFromMeta = meta?.full_name?.trim();
  const displayName = nameFromMeta || user.email || "there";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Dashboard
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome, {displayName}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          You&apos;re signed in. Jump to a section below.
        </p>
        <nav className="mt-8 flex flex-col gap-2 text-sm">
          <Link
            href="/dashboard/contacts"
            className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            Contacts
          </Link>
          <Link
            href="/dashboard/schedule"
            className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            Schedule a card (Pro)
          </Link>
          <Link
            href="/dashboard/upcoming"
            className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            Upcoming scheduled cards
          </Link>
          <Link
            href="/marketplace"
            className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            Marketplace
          </Link>
        </nav>
      </main>
    </div>
  );
}
