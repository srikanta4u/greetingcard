"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Variant = "card" | "footer";

const cardClass =
  "flex min-h-11 w-full items-center justify-center rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-violet-600";

const footerClass =
  "inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[200px]";

export function ProUpgradeCta({
  yearly,
  variant = "card",
}: {
  yearly: boolean;
  variant?: Variant;
}) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pro, setPro] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    setLoggedIn(Boolean(uid));
    if (!uid) {
      setPro(false);
      setReady(true);
      return;
    }
    const { data: profile } = await supabase
      .from("users")
      .select("subscription_active")
      .eq("id", uid)
      .maybeSingle();
    setPro(Boolean(profile?.subscription_active));
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  async function startCheckout() {
    setLoading(true);
    try {
      const billing = yearly ? "yearly" : "monthly";
      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing }),
      });
      const { url, error } = (await res.json()) as {
        url?: string;
        error?: string;
      };
      if (!res.ok) {
        console.error("[ProUpgradeCta]", error);
        setLoading(false);
        return;
      }
      if (url) {
        window.location.href = url;
        return;
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  const btnClass = variant === "footer" ? footerClass : `mt-8 ${cardClass}`;

  if (!ready) {
    return (
      <div
        className={`${btnClass} animate-pulse bg-violet-400 text-transparent dark:bg-violet-900`}
        aria-hidden
      >
        Upgrade to Pro
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <Link href="/auth/signup" className={btnClass}>
        Get started
      </Link>
    );
  }

  if (pro) {
    return (
      <button type="button" disabled className={btnClass}>
        Current Plan
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void startCheckout()}
      className={btnClass}
    >
      {loading ? "Redirecting…" : "Upgrade to Pro"}
    </button>
  );
}
