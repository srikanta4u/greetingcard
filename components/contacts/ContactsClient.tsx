"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AddressForm,
  type StandardizedAddress,
} from "@/components/contacts/AddressForm";

export type ContactEventRow = {
  id: string;
  event_type: string;
  event_date: string;
  recurs_annually: boolean;
};

export type ContactRow = {
  id: string;
  name: string;
  relationship: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  created_at: string;
  contact_events: ContactEventRow[] | null;
};

const EVENT_TYPE_OPTIONS = [
  "Birthday",
  "Anniversary",
  "Holiday",
  "Sympathy",
  "Thank You",
  "Other",
] as const;

function normalizeEvents(
  raw: ContactRow["contact_events"],
): ContactEventRow[] {
  if (!raw) {
    return [];
  }
  return Array.isArray(raw) ? raw : [];
}

function formatEventDate(iso: string) {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ContactsClient({
  initialContacts,
  subscriptionActive,
  atContactLimit,
}: {
  initialContacts: ContactRow[];
  subscriptionActive: boolean;
  atContactLimit: boolean;
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactRow[]>(() =>
    initialContacts.map((c) => ({
      ...c,
      contact_events: normalizeEvents(c.contact_events),
    })),
  );

  useEffect(() => {
    setContacts(
      initialContacts.map((c) => ({
        ...c,
        contact_events: normalizeEvents(c.contact_events),
      })),
    );
  }, [initialContacts]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelationship, setNewRelationship] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);

  const [eventFormContactId, setEventFormContactId] = useState<string | null>(
    null,
  );
  const [eventType, setEventType] = useState<string>(EVENT_TYPE_OPTIONS[0]);
  const [eventDate, setEventDate] = useState("");
  const [eventRecurring, setEventRecurring] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  const [editingEvent, setEditingEvent] = useState<{
    contactId: string;
    event: ContactEventRow;
  } | null>(null);
  const [editEventType, setEditEventType] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventRecurring, setEditEventRecurring] = useState(false);

  function openAddPanel() {
    setAddError(null);
    setNewName("");
    setNewRelationship("");
    setPanelOpen(true);
  }

  function closeAddPanel() {
    setPanelOpen(false);
    setAddError(null);
  }

  async function submitNewContact(address: StandardizedAddress) {
    setAddError(null);
    setSavingContact(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          relationship: newRelationship.trim() || undefined,
          ...address,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        details?: string;
        contact?: ContactRow;
      };

      if (!res.ok) {
        const msg = data.details
          ? `${data.error ?? "Could not save contact"}: ${data.details}`
          : (data.error ?? "Could not save contact");
        setAddError(msg);
        return;
      }
      if (data.contact) {
        const c = {
          ...data.contact,
          contact_events: normalizeEvents(data.contact.contact_events),
        };
        setContacts((prev) => [c, ...prev]);
      }
      closeAddPanel();
      router.refresh();
    } catch {
      setAddError("Network error");
    } finally {
      setSavingContact(false);
    }
  }

  function handleAddressConfirmed(addr: StandardizedAddress): void {
    if (!newName.trim()) {
      setAddError("Please enter a name before saving the address.");
      return;
    }
    void submitNewContact(addr);
  }

  async function deleteContact(id: string) {
    if (!window.confirm("Remove this contact? You can’t undo this.")) {
      return;
    }
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      return;
    }
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (expandedId === id) {
      setExpandedId(null);
    }
    router.refresh();
  }

  async function addEvent(contactId: string) {
    setEventError(null);
    if (!eventDate) {
      setEventError("Pick a date");
      return;
    }
    setEventSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          event_date: eventDate,
          recurs_annually: eventRecurring,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        event?: ContactEventRow;
      };
      if (!res.ok) {
        setEventError(data.error ?? "Could not add event");
        return;
      }
      if (data.event) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contactId
              ? {
                  ...c,
                  contact_events: [...normalizeEvents(c.contact_events), data.event!],
                }
              : c,
          ),
        );
      }
      setEventFormContactId(null);
      setEventDate("");
      setEventRecurring(false);
      router.refresh();
    } catch {
      setEventError("Network error");
    } finally {
      setEventSaving(false);
    }
  }

  async function deleteEvent(contactId: string, eventId: string) {
    const res = await fetch(`/api/contacts/${contactId}/events/${eventId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      return;
    }
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              contact_events: normalizeEvents(c.contact_events).filter(
                (e) => e.id !== eventId,
              ),
            }
          : c,
      ),
    );
    if (editingEvent?.event.id === eventId) {
      setEditingEvent(null);
    }
    router.refresh();
  }

  async function saveEditedEvent() {
    if (!editingEvent) {
      return;
    }
    const res = await fetch(
      `/api/contacts/${editingEvent.contactId}/events/${editingEvent.event.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: editEventType,
          event_date: editEventDate,
          recurs_annually: editEventRecurring,
        }),
      },
    );
    const data = (await res.json()) as { error?: string; event?: ContactEventRow };
    if (!res.ok || !data.event) {
      return;
    }
    const cid = editingEvent.contactId;
    setContacts((prev) =>
      prev.map((c) =>
        c.id === cid
          ? {
              ...c,
              contact_events: normalizeEvents(c.contact_events).map((e) =>
                e.id === data.event!.id ? data.event! : e,
              ),
            }
          : c,
      ),
    );
    setEditingEvent(null);
    router.refresh();
  }

  return (
    <div className="relative">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Contacts
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Keep addresses and important dates in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddPanel}
          disabled={atContactLimit}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add contact
        </button>
      </div>

      {atContactLimit ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          Upgrade to Pro to add unlimited contacts.
          {!subscriptionActive ? (
            <span className="ml-1 text-amber-800 dark:text-amber-300">
              Free plan is limited to 3 contacts.
            </span>
          ) : null}
        </div>
      ) : null}

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No contacts yet. Add someone you send cards to.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {contacts.map((c) => {
            const expanded = expandedId === c.id;
            const events = normalizeEvents(c.contact_events);
            return (
              <li
                key={c.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : c.id)
                  }
                  className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/80 sm:px-5"
                >
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {c.name}
                    </p>
                    {c.relationship ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {c.relationship}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {c.city}, {c.state} · {c.country}
                    </p>
                  </div>
                  <span className="shrink-0 text-zinc-400" aria-hidden>
                    {expanded ? "▾" : "▸"}
                  </span>
                </button>

                {expanded ? (
                  <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Full address
                    </p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {c.address_line1}
                      {c.address_line2 ? `, ${c.address_line2}` : ""}
                      <br />
                      {c.city}, {c.state} {c.postal_code}
                    </p>

                    <div className="mt-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Events
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setEventFormContactId(
                              eventFormContactId === c.id ? null : c.id,
                            );
                            setEventError(null);
                            setEventType(EVENT_TYPE_OPTIONS[0]);
                            setEventDate("");
                            setEventRecurring(false);
                          }}
                          className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                        >
                          Add event
                        </button>
                      </div>

                      {eventFormContactId === c.id ? (
                        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
                          {eventError ? (
                            <p className="mb-2 text-sm text-red-600 dark:text-red-400">
                              {eventError}
                            </p>
                          ) : null}
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                Type
                              </label>
                              <select
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                              >
                                {EVENT_TYPE_OPTIONS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                Date
                              </label>
                              <input
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                              />
                            </div>
                          </div>
                          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                            <input
                              type="checkbox"
                              checked={eventRecurring}
                              onChange={(e) =>
                                setEventRecurring(e.target.checked)
                              }
                              className="rounded border-zinc-300 dark:border-zinc-600"
                            />
                            Recurs annually
                          </label>
                          <button
                            type="button"
                            disabled={eventSaving}
                            onClick={() => void addEvent(c.id)}
                            className="mt-3 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                          >
                            {eventSaving ? "Saving…" : "Save event"}
                          </button>
                        </div>
                      ) : null}

                      <ul className="mt-3 space-y-2">
                        {events.length === 0 ? (
                          <li className="text-sm text-zinc-500 dark:text-zinc-400">
                            No events yet.
                          </li>
                        ) : (
                          events.map((ev) => (
                            <li
                              key={ev.id}
                              className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between"
                            >
                              {editingEvent?.event.id === ev.id &&
                              editingEvent.contactId === c.id ? (
                                <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                                  <select
                                    value={editEventType}
                                    onChange={(e) =>
                                      setEditEventType(e.target.value)
                                    }
                                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                                  >
                                    {EVENT_TYPE_OPTIONS.map((t) => (
                                      <option key={t} value={t}>
                                        {t}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="date"
                                    value={editEventDate}
                                    onChange={(e) =>
                                      setEditEventDate(e.target.value)
                                    }
                                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                                  />
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={editEventRecurring}
                                      onChange={(e) =>
                                        setEditEventRecurring(e.target.checked)
                                      }
                                    />
                                    Annual
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void saveEditedEvent()}
                                      className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingEvent(null)}
                                      className="text-xs text-zinc-600 underline dark:text-zinc-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                      {ev.event_type}
                                    </p>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                      {formatEventDate(ev.event_date)}
                                      {ev.recurs_annually
                                        ? " · Repeats yearly"
                                        : ""}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingEvent({
                                          contactId: c.id,
                                          event: ev,
                                        });
                                        setEditEventType(ev.event_type);
                                        setEditEventDate(ev.event_date);
                                        setEditEventRecurring(ev.recurs_annually);
                                      }}
                                      className="text-xs font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void deleteEvent(c.id, ev.id)
                                      }
                                      className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => void deleteContact(c.id)}
                      className="mt-6 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete contact
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {/* Slide-in add panel */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity dark:bg-black/60 ${
          panelOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
        onClick={closeAddPanel}
      />
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              New contact
            </h2>
            <button
              type="button"
              onClick={closeAddPanel}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 space-y-6 px-4 py-6">
            {addError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {addError}
              </p>
            ) : null}
            <div>
              <label
                htmlFor="new-contact-name"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Name
              </label>
              <input
                id="new-contact-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label
                htmlFor="new-contact-rel"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Relationship{" "}
                <span className="font-normal text-zinc-500">(optional)</span>
              </label>
              <input
                id="new-contact-rel"
                value={newRelationship}
                onChange={(e) => setNewRelationship(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="Mom, coworker…"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Address
              </p>
              <AddressForm
                onSave={handleAddressConfirmed}
                onCancel={closeAddPanel}
                submitLabel="Validate address"
              />
            </div>
            {savingContact ? (
              <p className="text-sm text-zinc-500">Saving contact…</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
