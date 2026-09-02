import type { EventItem } from "@/api/types";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return "Dates to be announced";
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export type EventStatusValue = "Live" | "Upcoming" | "Ended" | "Scheduled";

export function eventStatus(event: Pick<EventItem, "startDate" | "endDate">): EventStatusValue {
  const now = Date.now();
  const start = event.startDate ? new Date(event.startDate).getTime() : null;
  const end = event.endDate ? new Date(event.endDate).getTime() : null;
  if (!start || !end) return "Scheduled";
  if (now < start) return "Upcoming";
  if (now > end) return "Ended";
  return "Live";
}

/** Convert an ISO string to the value a datetime-local input expects. */
export function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export const DIFFICULTY_TONE: Record<string, string> = {
  EASY: "bg-primary-soft text-primary-soft-foreground",
  MEDIUM: "bg-info/15 text-info",
  HARD: "bg-warning/20 text-warning-foreground dark:text-warning",
  EXPERT: "bg-destructive/15 text-destructive",
};
