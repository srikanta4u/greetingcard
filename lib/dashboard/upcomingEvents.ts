import { getNextOccurrence } from "@/lib/scheduling";

export type ContactEventInput = {
  id: string;
  event_type: string;
  event_date: string;
  recurs_annually: boolean;
};

export type ContactWithEventsInput = {
  id: string;
  name: string;
  contact_events: ContactEventInput[] | null;
};

export type UpcomingEventRow = {
  contactId: string;
  contactName: string;
  eventId: string;
  eventType: string;
  occurrence: Date;
  occurrenceYmd: string;
  daysUntil: number;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return new Date(s);
  return new Date(y, m - 1, d);
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function daysFromTodayTo(target: Date): number {
  const t0 = startOfDay(new Date()).getTime();
  const t1 = startOfDay(target).getTime();
  return Math.round((t1 - t0) / 86400000);
}

/**
 * Events whose next occurrence falls between today and today + horizonDays (inclusive).
 */
export function getUpcomingEventsInWindow(
  contacts: ContactWithEventsInput[],
  horizonDays: number,
): UpcomingEventRow[] {
  const today = startOfDay(new Date());
  const end = addDays(today, horizonDays);
  const rows: UpcomingEventRow[] = [];

  for (const c of contacts) {
    const events = c.contact_events;
    if (!events?.length) continue;
    for (const ev of events) {
      const base = parseIsoDate(ev.event_date);
      let next: Date;
      if (ev.recurs_annually) {
        next = startOfDay(getNextOccurrence(base));
      } else {
        next = startOfDay(base);
      }
      if (next < today || next > end) continue;
      rows.push({
        contactId: c.id,
        contactName: c.name,
        eventId: ev.id,
        eventType: ev.event_type,
        occurrence: next,
        occurrenceYmd: formatYmd(next),
        daysUntil: daysFromTodayTo(next),
      });
    }
  }

  rows.sort((a, b) => a.occurrence.getTime() - b.occurrence.getTime());
  return rows;
}
