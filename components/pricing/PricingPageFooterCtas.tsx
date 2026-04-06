"use client";

import { ProUpgradeCta } from "@/components/pricing/ProUpgradeCta";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * FAQ section CTAs: free signup/dashboard link + Pro upgrade (monthly billing).
 */
export function PricingPageFooterCtas() {
  const [loggedIn, setLoggedIn] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(Boolean(session?.user));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
      {loggedIn === undefined ? (
        <>
          <div className="h-11 w-full min-w-[200px] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800 sm:w-auto" />
          <div className="h-11 w-full min-w-[200px] animate-pulse rounded-xl bg-violet-300 dark:bg-violet-900 sm:w-auto" />
        </>
      ) : loggedIn ? (
        <>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl border-2 border-violet-200 bg-white px-6 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 sm:w-auto sm:min-w-[200px] dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-300 dark:hover:bg-violet-950/50"
          >
            Go to dashboard
          </Link>
          <ProUpgradeCta yearly={false} variant="footer" />
        </>
      ) : (
        <>
          <Link
            href="/auth/signup"
            className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl border-2 border-violet-200 bg-white px-6 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 sm:w-auto sm:min-w-[200px] dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-300 dark:hover:bg-violet-950/50"
          >
            Get started free
          </Link>
          <ProUpgradeCta yearly={false} variant="footer" />
        </>
      )}
    </div>
  );
}
