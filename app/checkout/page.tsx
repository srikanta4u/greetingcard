"use client";

import { AddressForm, type StandardizedAddress } from "@/components/contacts/AddressForm";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const TAX_RATE = 0.08;
const MESSAGE_PREVIEW_LEN = 100;

type PendingOrder = {
  designId: string;
  designTitle: string;
  frontImageUrl: string;
  message: string;
  font: string;
  color: string;
  price: number;
};

type ContactRow = {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

const FONT_LABELS: Record<string, string> = {
  classic: "Classic",
  modern: "Modern",
  script: "Script",
};

function formatMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Spinner() {
  return (
    <span
      className="inline-block size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-600 dark:border-zinc-600 dark:border-t-violet-400"
      aria-hidden
    />
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [recipientAddress, setRecipientAddress] =
    useState<StandardizedAddress | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem("pendingOrder");
      if (!raw) {
        router.replace("/marketplace");
        return;
      }
      const parsed = JSON.parse(raw) as Partial<PendingOrder>;
      if (
        !parsed.designId ||
        typeof parsed.designTitle !== "string" ||
        typeof parsed.frontImageUrl !== "string" ||
        typeof parsed.price !== "number"
      ) {
        router.replace("/marketplace");
        return;
      }
      setPendingOrder({
        designId: parsed.designId,
        designTitle: parsed.designTitle,
        frontImageUrl: parsed.frontImageUrl,
        message: typeof parsed.message === "string" ? parsed.message : "",
        font: typeof parsed.font === "string" ? parsed.font : "modern",
        color: typeof parsed.color === "string" ? parsed.color : "#1a1a1a",
        price: parsed.price,
      });
    } catch {
      router.replace("/marketplace");
    }
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted || !pendingOrder) return;

    const supabase = createClient();
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ok = Boolean(session?.user);
      setLoggedIn(ok);
      if (!ok) return;

      setContactsLoading(true);
      try {
        const res = await fetch("/api/contacts");
        if (!res.ok) {
          setContacts([]);
          return;
        }
        const data = (await res.json()) as { contacts?: ContactRow[] };
        const list = data.contacts ?? [];
        setContacts(list);
        if (list.length > 0) {
          setSelectedContactId(list[0].id);
        } else {
          setUseNewAddress(true);
        }
      } finally {
        setContactsLoading(false);
      }
    })();
  }, [mounted, pendingOrder]);

  const cardPrice = pendingOrder?.price ?? 0;
  const tax = useMemo(
    () => Math.round(cardPrice * TAX_RATE * 100) / 100,
    [cardPrice],
  );
  const total = useMemo(
    () => Math.round((cardPrice + tax) * 100) / 100,
    [cardPrice, tax],
  );

  const messagePreview = pendingOrder?.message
    ? pendingOrder.message.slice(0, MESSAGE_PREVIEW_LEN) +
      (pendingOrder.message.length > MESSAGE_PREVIEW_LEN ? "…" : "")
    : "";

  const fontLabel = pendingOrder
    ? FONT_LABELS[pendingOrder.font] ?? pendingOrder.font
    : "";

  const onAddressSaved = useCallback((addr: StandardizedAddress) => {
    setRecipientAddress(addr);
    setError(null);
  }, []);

  const handlePay = async () => {
    if (!pendingOrder) return;
    setError(null);

    if (!loggedIn) {
      if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
        setError("Please enter a valid email.");
        return;
      }
      if (!recipientAddress) {
        setError("Please validate and confirm a shipping address.");
        return;
      }
    } else if (useNewAddress) {
      if (!recipientAddress) {
        setError("Please validate and confirm a shipping address.");
        return;
      }
    } else if (contacts.length > 0 && !useNewAddress) {
      if (!selectedContactId) {
        setError("Select a saved contact or enter a new address.");
        return;
      }
    } else if (!recipientAddress) {
      setError("Please validate and confirm a shipping address.");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        designId: pendingOrder.designId,
        personalization: {
          message: pendingOrder.message,
          font: pendingOrder.font,
          color: pendingOrder.color,
        },
      };

      if (loggedIn) {
        if (useNewAddress) {
          body.recipientAddress = recipientAddress;
        } else {
          body.contactId = selectedContactId;
        }
      } else {
        body.guestEmail = guestEmail.trim();
        body.recipientAddress = recipientAddress;
      }

      const res = await fetch("/api/orders/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }
      if (!data.checkoutUrl) {
        setError("Checkout URL missing.");
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !pendingOrder) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/marketplace"
          className="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
        >
          ← Back to marketplace
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Checkout
        </h1>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Order summary
          </h2>
          <div className="mt-4 flex gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingOrder.frontImageUrl}
              alt=""
              className="h-28 w-20 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {pendingOrder.designTitle}
              </p>
              {messagePreview ? (
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {messagePreview}
                </p>
              ) : (
                <p className="text-sm italic text-zinc-500">No message</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Font</span>
                <span className="font-medium">{fontLabel}</span>
                <span
                  className="inline-block size-6 rounded-full border border-zinc-300 shadow-inner dark:border-zinc-600"
                  style={{ backgroundColor: pendingOrder.color }}
                  title={pendingOrder.color}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Recipient
          </h2>

          {loggedIn ? (
            <div className="mt-4 space-y-4">
              {contactsLoading ? (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Spinner />
                  Loading contacts…
                </div>
              ) : contacts.length > 0 ? (
                <div>
                  <label
                    htmlFor="contact"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Saved contact
                  </label>
                  <select
                    id="contact"
                    disabled={useNewAddress}
                    value={selectedContactId}
                    onChange={(e) => {
                      setSelectedContactId(e.target.value);
                      setError(null);
                    }}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.city}, {c.state}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  You have no saved contacts. Enter a new address below.
                </p>
              )}

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useNewAddress}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setUseNewAddress(on);
                    if (on) {
                      setRecipientAddress(null);
                    }
                    setError(null);
                  }}
                  className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                />
                Or enter a new address
              </label>

              {useNewAddress || contacts.length === 0 ? (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <AddressForm
                    onSave={onAddressSaved}
                    submitLabel="Validate address"
                  />
                  {recipientAddress && (
                    <p className="mt-3 text-sm text-green-700 dark:text-green-400">
                      Address confirmed for this order.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="guest-email"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Email
                </label>
                <input
                  id="guest-email"
                  type="email"
                  autoComplete="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
              <AddressForm
                onSave={onAddressSaved}
                submitLabel="Validate address"
              />
              {recipientAddress && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  Address confirmed for this order.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Price
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Card</dt>
              <dd>{formatMoney(cardPrice)}</dd>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <dt>Tax (8%)</dt>
              <dd>{formatMoney(tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold dark:border-zinc-700">
              <dt>Total</dt>
              <dd>{formatMoney(total)}</dd>
            </div>
          </dl>
        </section>

        {error ? (
          <p
            className="mt-4 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handlePay()}
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Spinner />
              Redirecting…
            </>
          ) : (
            "Pay now"
          )}
        </button>
      </div>
    </div>
  );
}
