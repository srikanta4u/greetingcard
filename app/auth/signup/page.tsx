"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center overflow-x-hidden bg-zinc-50 px-4 py-10 dark:bg-zinc-950 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto w-full min-w-0 max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 text-center shadow-sm sm:px-8 sm:py-10 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
              <svg
                className="h-6 w-6 text-emerald-700 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Check your email to confirm your account
            </h1>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              We sent a confirmation link to <strong className="text-zinc-800 dark:text-zinc-200">{email}</strong>. Click the link in the email to finish signing up.
            </p>
            <Link
              href="/auth/login"
              className="mt-8 inline-block text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center overflow-x-hidden bg-zinc-50 px-4 py-10 dark:bg-zinc-950 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Create an account
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Enter your details to get started.
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
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm outline-none ring-zinc-400 transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/20"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm outline-none ring-zinc-400 transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/20"
                placeholder="At least 8 characters"
              />
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
                Minimum 8 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
