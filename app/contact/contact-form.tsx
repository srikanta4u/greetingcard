"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
      >
        <p className="font-medium">Thanks — your message was sent.</p>
        <p className="mt-2 text-sm opacity-90">
          We&apos;ll get back to you as soon as we can.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 shadow-sm outline-none ring-violet-500/0 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 shadow-sm outline-none ring-violet-500/0 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minLength={10}
          maxLength={10000}
          className="mt-1.5 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 shadow-sm outline-none ring-violet-500/0 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <p className="mt-1 text-xs text-zinc-500">Minimum 10 characters.</p>
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
