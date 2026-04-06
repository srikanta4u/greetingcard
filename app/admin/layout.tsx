import { requireAdmin } from "@/lib/admin/requireAdmin";
import Link from "next/link";

const NAV = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/refunds", label: "Refunds" },
  { href: "/admin/designs", label: "Designs" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/admin");

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              Admin
            </span>
            <nav className="flex flex-wrap gap-2 text-sm font-medium">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
