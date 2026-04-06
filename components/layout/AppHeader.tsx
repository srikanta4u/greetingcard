"use client";

import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Client-side Supabase browser client (@supabase/ssr createBrowserClient).
 * Same session API as legacy createClientComponentClient from auth-helpers.
 */
function getSupabase() {
  return createClient();
}

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
  { href: "/creator/apply", label: "For Creators" },
] as const;

const linkClass =
  "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-violet-50 hover:text-violet-800 dark:text-zinc-400 dark:hover:bg-violet-950/50 dark:hover:text-violet-200";

const menuItemClass =
  "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800";

export function AppHeader() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabase();

    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  async function handleLogout() {
    setLogoutLoading(true);
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    setMenuOpen(false);
    setLogoutLoading(false);
    router.refresh();
    router.push("/");
  }

  const email = session?.user.email?.trim() ?? "";
  const meta = session?.user.user_metadata as { full_name?: string } | undefined;
  const display =
    meta?.full_name?.trim() ||
    (email ? email.split("@")[0] : "");
  const avatarLetter = (display[0] ?? email[0] ?? "?").toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-violet-100/80 bg-white/90 backdrop-blur-md dark:border-violet-900/30 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 min-w-0 shrink items-center gap-2 text-lg font-bold tracking-tight text-violet-700 dark:text-violet-300"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-sm font-extrabold text-white shadow-md shadow-violet-600/25"
            aria-hidden
          >
            A
          </span>
          <span className="truncate text-zinc-900 dark:text-white">
            AutoCard
          </span>
        </Link>

        {loading ? (
          <>
            <div className="hidden flex-1 md:mx-8 md:block" aria-hidden>
              <div className="mx-auto h-11 max-w-md animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800" />
            </div>
            <div
              className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-zinc-200/80 md:ml-auto dark:bg-zinc-800"
              aria-hidden
            />
          </>
        ) : (
          <>
            <nav
              className="hidden md:flex md:flex-1 md:justify-center md:gap-0.5"
              aria-label="Main"
            >
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={linkClass}>
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {!session ? (
                <>
                  <Link
                    href="/auth/login"
                    className="flex min-h-11 min-w-[44px] items-center justify-center rounded-lg px-3 text-sm font-semibold text-zinc-700 transition hover:text-violet-700 dark:text-zinc-300 dark:hover:text-violet-300"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="hidden min-h-11 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition hover:bg-violet-500 sm:flex dark:bg-violet-600 dark:hover:bg-violet-500"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    type="button"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                    aria-label="Account menu"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex min-h-11 max-w-[220px] items-center gap-2 rounded-lg border border-zinc-200 px-2 py-1.5 text-left transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200"
                      aria-hidden
                    >
                      {avatarLetter}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {email || display}
                    </span>
                    <svg
                      className={`h-4 w-4 shrink-0 text-zinc-500 transition ${dropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {dropdownOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 z-[100] mt-2 min-w-[220px] rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/orders"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Orders
                      </Link>
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Account Settings
                      </Link>
                      <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
                      <button
                        type="button"
                        role="menuitem"
                        disabled={logoutLoading}
                        onClick={() => void handleLogout()}
                        className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        {logoutLoading ? "Signing out…" : "Log out"}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-800 transition hover:bg-zinc-100 md:hidden dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                aria-expanded={menuOpen}
                aria-controls="app-header-mobile-menu"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {!loading && (
        <div
          id="app-header-mobile-menu"
          className={`overflow-hidden border-t border-violet-100 transition-[max-height] duration-200 ease-out md:hidden dark:border-violet-900/30 ${
            menuOpen ? "max-h-[32rem]" : "max-h-0"
          }`}
        >
          <div
            className="flex flex-col gap-1 px-4 pb-4 pt-2"
            onClick={() => setMenuOpen(false)}
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={linkClass}>
                  {label}
                </Link>
              ))}
            </nav>
            {!session ? (
              <div className="mt-3 flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <Link
                  href="/auth/login"
                  className="flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex min-h-11 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <p className="truncate px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {email || display}
                </p>
                <Link href="/dashboard" className={linkClass}>
                  Dashboard
                </Link>
                <Link href="/dashboard/orders" className={linkClass}>
                  Orders
                </Link>
                <Link href="/dashboard" className={linkClass}>
                  Account Settings
                </Link>
                <button
                  type="button"
                  disabled={logoutLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleLogout();
                  }}
                  className="mt-1 flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-red-700 dark:text-red-400"
                >
                  {logoutLoading ? "Signing out…" : "Log out"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
