"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

const linkClass =
  "mt-8 flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-violet-200 bg-white py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-300 dark:hover:bg-violet-950/50";

export function GetStartedFreeCta() {
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
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loggedIn === undefined) {
    return (
      <div
        className={`${linkClass} animate-pulse bg-zinc-100 text-transparent dark:bg-zinc-800`}
        aria-hidden
      >
        Get started free
      </div>
    );
  }

  if (loggedIn) {
    return (
      <Link href="/dashboard" className={linkClass}>
        Go to dashboard
      </Link>
    );
  }

  return (
    <Link href="/auth/signup" className={linkClass}>
      Get started free
    </Link>
  );
}
