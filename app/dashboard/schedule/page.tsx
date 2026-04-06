"use client";

import { OptimizedImage } from "@/app/components/OptimizedImage";
import type { ContactEventRow, ContactRow } from "@/components/contacts/ContactsClient";
import {
  calculateSendDate,
  countryForScheduling,
  getNextOccurrence,
  type ScheduleCountry,
} from "@/lib/scheduling";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Thank You",
  "Sympathy",
  "Holiday",
  "Congratulations",
  "Other",
] as const;

const ACCENT_COLORS = [
  "#1a1a1a",
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
] as const;

const FONTS = [
  {
    id: "classic" as const,
    label: "Classic",
    previewStyle: { fontFamily: 'Georgia, "Times New Roman", serif' },
  },
  {
    id: "modern" as const,
    label: "Modern",
    previewStyle: { fontFamily: "ui-sans-serif, system-ui, sans-serif" },
  },
  {
    id: "script" as const,
    label: "Script",
    previewStyle: {
      fontFamily: '"Apple Chancery", "Brush Script MT", cursive',
    },
  },
];

const MESSAGE_MAX = 1500;
const PROFANITY = ["fuck", "shit", "ass", "bastard", "bitch"] as const;

function hasProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(lower);
  });
}

function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return new Date(s);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatLong(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type DesignRow = {
  id: string;
  title: string;
  front_image_url: string;
  base_price: number;
  creator_markup: number;
  tags_occasion: string[] | null;
};

function normalizeContacts(raw: unknown): ContactRow[] {
  if (!Array.isArray(raw)) return [];
  return raw as ContactRow[];
}

function normalizeEvents(
  raw: ContactRow["contact_events"],
): ContactEventRow[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [];
}

function nextDeliveryDate(ev: ContactEventRow): Date | null {
  const base = parseIsoDate(ev.event_date);
  if (Boolean(ev.recurs_annually)) {
    return getNextOccurrence(base);
  }
  const d = startOfDay(base);
  const today = startOfDay(new Date());
  if (d >= today) return d;
  return null;
}

export default function SchedulePage() {
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [contactsErr, setContactsErr] = useState<string | null>(null);
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [designsLoading, setDesignsLoading] = useState(false);
  const [occasionFilter, setOccasionFilter] = useState<string>("");

  const [step, setStep] = useState(1);
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(
    null,
  );
  const [selectedEvent, setSelectedEvent] = useState<ContactEventRow | null>(
    null,
  );
  const [selectedDesign, setSelectedDesign] = useState<DesignRow | null>(null);
  const [message, setMessage] = useState("");
  const [fontId, setFontId] = useState<(typeof FONTS)[number]["id"]>("modern");
  const [accentColor, setAccentColor] = useState<string>(ACCENT_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProfileAndContacts = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth/login?redirectTo=/dashboard/schedule");
      return;
    }
    const { data: profile } = await supabase
      .from("users")
      .select("subscription_active")
      .eq("id", user.id)
      .maybeSingle();
    setSubscriptionActive(Boolean(profile?.subscription_active));

    const res = await fetch("/api/contacts");
    if (!res.ok) {
      setContactsErr("Could not load contacts.");
      setContacts([]);
    } else {
      const data = (await res.json()) as { contacts?: unknown };
      setContacts(normalizeContacts(data.contacts));
      setContactsErr(null);
    }
    setBooting(false);
  }, [router]);

  useEffect(() => {
    void loadProfileAndContacts();
  }, [loadProfileAndContacts]);

  const loadDesigns = useCallback(async () => {
    setDesignsLoading(true);
    try {
      const q = occasionFilter
        ? `?occasion=${encodeURIComponent(occasionFilter)}`
        : "";
      const res = await fetch(`/api/designs/active${q}`);
      if (!res.ok) {
        setDesigns([]);
        return;
      }
      const data = (await res.json()) as { designs?: DesignRow[] };
      setDesigns(data.designs ?? []);
    } finally {
      setDesignsLoading(false);
    }
  }, [occasionFilter]);

  useEffect(() => {
    if (!subscriptionActive || step !== 3) return;
    void loadDesigns();
  }, [subscriptionActive, step, loadDesigns]);

  const scheduleCountry: ScheduleCountry = useMemo(() => {
    if (!selectedContact) return "US";
    return countryForScheduling(selectedContact.country);
  }, [selectedContact]);

  const deliveryDate = useMemo(() => {
    if (!selectedEvent) return null;
    return nextDeliveryDate(selectedEvent);
  }, [selectedEvent]);

  const dispatchDate = useMemo(() => {
    if (!deliveryDate) return null;
    return calculateSendDate(deliveryDate, scheduleCountry);
  }, [deliveryDate, scheduleCountry]);

  const fontDef = FONTS.find((f) => f.id === fontId) ?? FONTS[1];

  const handleSchedulePay = async () => {
    setFormError(null);
    if (
      !selectedContact ||
      !selectedEvent ||
      !selectedDesign ||
      !deliveryDate
    ) {
      setFormError("Complete all steps first.");
      return;
    }
    if (!message.trim()) {
      setFormError("Please write a message for your card.");
      return;
    }
    if (hasProfanity(message)) {
      setFormError("Your message contains inappropriate content.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: selectedDesign.id,
          contactId: selectedContact.id,
          contactEventId: selectedEvent.id,
          personalization: {
            message: message.trim(),
            font: fontId,
            color: accentColor,
          },
        }),
      });
      const data = (await res.json()) as { orderId?: string; error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Could not schedule order.");
        return;
      }
      if (!data.orderId) {
        setFormError("Missing order id.");
        return;
      }
      router.push(
        `/order-confirmation?mock=true&orderId=${encodeURIComponent(data.orderId)}`,
      );
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (booting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-600 dark:border-zinc-600 dark:border-t-violet-400" />
      </div>
    );
  }

  if (!subscriptionActive) {
    return (
      <div className="mx-auto max-w-lg py-4 text-center sm:py-8">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Schedule cards with Pro
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Scheduled sending for birthdays and anniversaries is included with
          an active AutoCard Pro subscription.
        </p>
        <Link
          href="/pricing"
          className="mt-8 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
        >
          View plans
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Schedule a card
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Pick a contact, event, design, and message. We&apos;ll dispatch on time
        for Pro subscribers.
      </p>

      <div className="mb-8 mt-8 flex flex-wrap gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={
                step === n
                  ? "rounded-full bg-violet-600 px-2.5 py-1 text-white"
                  : "rounded-full px-2.5 py-1"
              }
            >
              {n}.{" "}
              {n === 1
                ? "Contact"
                : n === 2
                  ? "Event"
                  : n === 3
                    ? "Card"
                    : n === 4
                      ? "Message"
                      : "Review"}
            </span>
          ))}
        </div>

        {contactsErr ? (
          <p className="text-sm text-red-600 dark:text-red-400">{contactsErr}</p>
        ) : null}

        {step === 1 && (
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Choose a contact
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Pick who will receive this card.
            </p>
            <ul className="mt-6 space-y-3">
              {contacts.map((c) => {
                const line2 = c.address_line2 ? `, ${c.address_line2}` : "";
                const addr = `${c.address_line1}${line2}, ${c.city}, ${c.state} ${c.postal_code}, ${c.country}`;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContact(c);
                        setSelectedEvent(null);
                        setSelectedDesign(null);
                        setStep(2);
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-700"
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {c.name}
                      </p>
                      {c.relationship ? (
                        <p className="text-sm text-violet-600 dark:text-violet-400">
                          {c.relationship}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {addr}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
            {contacts.length === 0 ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                No contacts yet.{" "}
                <Link
                  href="/dashboard/contacts"
                  className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
                >
                  Add contacts
                </Link>
              </p>
            ) : null}
          </section>
        )}

        {step === 2 && selectedContact && (
          <section>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              ← Back
            </button>
            <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Choose an event for {selectedContact.name}
            </h2>
            <ul className="mt-6 space-y-3">
              {normalizeEvents(selectedContact.contact_events).map((ev) => {
                const next = nextDeliveryDate(ev);
                const selected = selectedEvent?.id === ev.id;
                return (
                  <li key={ev.id}>
                    <button
                      type="button"
                      disabled={!next}
                      onClick={() => {
                        if (!next) return;
                        setSelectedEvent(ev);
                      }}
                      className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900 ${
                        selected
                          ? "border-violet-500 ring-1 ring-violet-500"
                          : "border-zinc-200 enabled:hover:border-violet-300 dark:border-zinc-800 dark:enabled:hover:border-violet-700"
                      }`}
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {ev.event_type}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {ev.recurs_annually ? "Repeats yearly" : "One-time"} · on{" "}
                        {parseIsoDate(ev.event_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {next ? (
                        <p className="mt-2 text-sm font-medium text-violet-600 dark:text-violet-400">
                          Next occurrence: {formatLong(next)}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-zinc-500">
                          Past date — choose another event
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectedEvent && deliveryDate && dispatchDate ? (
              <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Card will be dispatched on:
                  </span>{" "}
                  {formatLong(dispatchDate)}
                </p>
                <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Estimated delivery:
                  </span>{" "}
                  {formatLong(deliveryDate)}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  Continue to choose card
                </button>
              </div>
            ) : null}
            {normalizeEvents(selectedContact.contact_events).length === 0 ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                No events on this contact. Add one from{" "}
                <Link
                  href="/dashboard/contacts"
                  className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
                >
                  Contacts
                </Link>
                .
              </p>
            ) : null}
          </section>
        )}

        {step === 3 && selectedContact && selectedEvent && deliveryDate && (
          <section>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              ← Back
            </button>
            <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Choose a card
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="text-sm text-zinc-600 dark:text-zinc-400">
                Occasion
              </label>
              <select
                value={occasionFilter}
                onChange={(e) => setOccasionFilter(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="">All</option>
                {OCCASIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            {designsLoading ? (
              <div className="mt-8 flex justify-center py-12">
                <div className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-600" />
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {designs.map((d, di) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDesign(d);
                        setStep(4);
                      }}
                      className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition hover:border-violet-400 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-950">
                        <OptimizedImage
                          src={d.front_image_url}
                          alt={d.title}
                          fill
                          priority={di < 3}
                          sizes="(max-width: 640px) 50vw, 33vw"
                          containerClassName="absolute inset-0"
                          className="object-cover"
                        />
                      </div>
                      <p className="p-2 text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {d.title}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!designsLoading && designs.length === 0 ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                No designs match this filter.
              </p>
            ) : null}
          </section>
        )}

        {step === 4 &&
          selectedContact &&
          selectedEvent &&
          selectedDesign &&
          deliveryDate && (
            <section>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                ← Back
              </button>
              <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Customize your message
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Inside message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={MESSAGE_MAX}
                    rows={6}
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                    style={fontDef.previewStyle}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    {message.length} / {MESSAGE_MAX}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Font
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {FONTS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontId(f.id)}
                        className={
                          fontId === f.id
                            ? "rounded-lg border-2 border-violet-600 px-3 py-2 text-sm"
                            : "rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                        }
                        style={f.previewStyle}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Accent color
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Color ${c}`}
                        onClick={() => setAccentColor(c)}
                        className={
                          accentColor === c
                            ? "size-9 rounded-full ring-2 ring-violet-600 ring-offset-2 dark:ring-offset-zinc-950"
                            : "size-9 rounded-full ring-1 ring-zinc-300 dark:ring-zinc-600"
                        }
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="mt-8 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Review & confirm
              </button>
            </section>
          )}

        {step === 5 &&
          selectedContact &&
          selectedEvent &&
          selectedDesign &&
          deliveryDate &&
          dispatchDate && (
            <section>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                ← Back
              </button>
              <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Review
              </h2>
              <div className="mt-4 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p>
                  <span className="font-medium">To:</span>{" "}
                  {selectedContact.name}
                </p>
                <p>
                  <span className="font-medium">Event:</span>{" "}
                  {selectedEvent.event_type} · {formatLong(deliveryDate)}
                </p>
                <p>
                  <span className="font-medium">Dispatch:</span>{" "}
                  {formatLong(dispatchDate)}
                </p>
                <p>
                  <span className="font-medium">Card:</span>{" "}
                  {selectedDesign.title}
                </p>
                <div className="flex gap-3 pt-2">
                  <OptimizedImage
                    src={selectedDesign.front_image_url}
                    alt={selectedDesign.title}
                    fill={false}
                    width={56}
                    height={80}
                    sizes="56px"
                    className="rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                    containerClassName="shrink-0 !block overflow-hidden rounded-lg"
                  />
                  <p
                    className="min-w-0 flex-1 text-zinc-600 dark:text-zinc-400"
                    style={fontDef.previewStyle}
                  >
                    {message.trim() || "—"}
                  </p>
                </div>
              </div>

              {formError ? (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                  {formError}
                </p>
              ) : null}

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSchedulePay()}
                className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {submitting ? "Scheduling…" : "Schedule & pay"}
              </button>
            </section>
          )}
    </div>
  );
}
