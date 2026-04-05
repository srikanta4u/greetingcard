import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/admin");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }
}

export default async function AdminHomePage() {
  await requireAdmin();

  const links: {
    href: string;
    label: string;
    placeholder?: boolean;
  }[] = [
    { href: "/admin/designs", label: "Design approval queue" },
    { href: "/admin/orders", label: "Orders", placeholder: true },
    { href: "/admin/refunds", label: "Refunds", placeholder: true },
  ];

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Admin
          </span>
          <Link
            href="/"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Manage marketplace operations.
        </p>

        <ul className="mt-10 space-y-3">
          {links.map((item) => (
            <li key={item.href}>
              {item.placeholder ? (
                <span className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                  {item.label}
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Coming soon
                  </span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {item.label}
                  <span aria-hidden className="text-zinc-400">
                    →
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
