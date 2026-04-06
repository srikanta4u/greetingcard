"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
        setInvalidLink(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "PASSWORD_RECOVERY" ||
          event === "INITIAL_SESSION")
      ) {
        setSessionReady(true);
        setInvalidLink(false);
      }
    });

    const t = window.setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setInvalidLink(true);
        } else {
          setSessionReady(true);
          setInvalidLink(false);
        }
      });
    }, 2000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
    await supabase.auth.signOut();
    window.setTimeout(() => {
      router.replace("/auth/login");
    }, 2000);
  }

  if (success) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center overflow-x-hidden bg-zinc-50 px-4 py-10 dark:bg-zinc-950 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto w-full min-w-0 max-w-md text-center">
          <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Your password has been updated.
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Redirecting to sign in…
            </p>
            <Link
              href="/auth/login"
              className="mt-6 inline-block text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (invalidLink && !sessionReady) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center overflow-x-hidden bg-zinc-50 px-4 py-10 dark:bg-zinc-950 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto w-full min-w-0 max-w-md text-center">
          <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              This reset link is invalid or has expired. Request a new one from
              the sign-in page.
            </p>
            <Link
              href="/auth/forgot-password"
              className="mt-6 inline-block text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Forgot password
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionReady && !invalidLink) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center overflow-x-hidden bg-zinc-50 px-4 py-10 dark:bg-zinc-950 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Set a new password
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              >
                {error}
              </div>
            ) : null}

            <div>
              <label
                htmlFor="new-password"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                New password
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm outline-none ring-zinc-400 transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/20"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm outline-none ring-zinc-400 transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/auth/login"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
