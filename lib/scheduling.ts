export type ScheduleCountry = "US" | "CA" | "IN";

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addCalendarDays(d: Date, delta: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

const LEAD_DAYS: Record<ScheduleCountry, number> = {
  US: 4,
  CA: 4,
  IN: 14,
};

/**
 * Dispatch date: N calendar days before the event, adjusted so it never lands on a weekend.
 */
export function calculateSendDate(
  eventDate: Date,
  country: ScheduleCountry,
): Date {
  const lead = LEAD_DAYS[country];
  const eventDay = startOfLocalDay(eventDate);
  let sendDate = addCalendarDays(eventDay, -lead);
  const dow = sendDate.getDay();
  if (dow === 6) {
    sendDate = addCalendarDays(sendDate, -1);
  } else if (dow === 0) {
    sendDate = addCalendarDays(sendDate, -2);
  }
  return sendDate;
}

/**
 * Next upcoming calendar occurrence for an annual event (month/day from `eventDate`).
 */
export function getNextOccurrence(eventDate: Date): Date {
  const today = startOfLocalDay(new Date());
  const y = today.getFullYear();
  const month = eventDate.getMonth();
  const day = eventDate.getDate();
  const candidate = new Date(y, month, day);
  if (candidate >= today) {
    return candidate;
  }
  return new Date(y + 1, month, day);
}

export function countryForScheduling(
  code: string | null | undefined,
): ScheduleCountry {
  const c = (code ?? "US").toUpperCase();
  if (c === "CA" || c === "IN") return c;
  return "US";
}
