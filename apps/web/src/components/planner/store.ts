import type { EventInput } from "@fullcalendar/react";
import {
  IMPORTANCE_META,
  type Category,
  type PlannerEvent,
  type RecurrencePreset,
} from "./types";

const STORAGE_KEY = "planner.events.v1";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function seedEvents(): PlannerEvent[] {
  const now = new Date();
  const at = (dayOffset: number, h: number, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const iso = (d: Date) => d.toISOString();
  const plusMin = (d: Date, min: number) =>
    new Date(d.getTime() + min * 60_000);

  const workout = at(1, 18);
  const climbing = at(2, 19);

  return [
    {
      id: uid(),
      title: "Workout — push day",
      start: iso(workout),
      end: iso(plusMin(workout, 60)),
      allDay: false,
      importance: "high",
      category: "workout",
      notes: "Drag me or use +1 day when you need recovery.",
      recurrence: "weekly",
    },
    {
      id: uid(),
      title: "Climbing session",
      start: iso(climbing),
      end: iso(plusMin(climbing, 120)),
      allDay: false,
      importance: "normal",
      category: "climbing",
      notes: "Every 3rd week: 2 weeks off, 3rd week on.",
      recurrence: "every3weeks",
    },
    {
      id: uid(),
      title: "Plan the week",
      start: iso(at(0, 9)),
      end: iso(plusMin(at(0, 9), 30)),
      allDay: false,
      importance: "low",
      category: "general",
      notes: "",
      recurrence: "none",
    },
  ];
}

export function loadEvents(): PlannerEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedEvents();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as PlannerEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: PlannerEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // storage full / private mode — keep in-memory only
  }
}

export function createId(): string {
  return uid();
}

function toDurationString(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const totalMin = Math.max(15, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function rruleFor(
  recurrence: RecurrencePreset,
  dtstart: string,
): Record<string, unknown> | null {
  const dt = new Date(dtstart);
  if (Number.isNaN(dt.getTime())) return null;
  switch (recurrence) {
    case "daily":
      return { freq: "daily", dtstart: dt };
    case "weekly":
      return { freq: "weekly", dtstart: dt };
    case "every2weeks":
      return { freq: "weekly", interval: 2, dtstart: dt };
    case "every3weeks":
      return { freq: "weekly", interval: 3, dtstart: dt };
    case "weekdays":
      return {
        freq: "weekly",
        byweekday: ["mo", "tu", "we", "th", "fr"],
        dtstart: dt,
      };
    default:
      return null;
  }
}

export function toFullCalendarInput(
  event: PlannerEvent,
  visibleCategories?: Set<Category>,
): EventInput | null {
  if (visibleCategories && !visibleCategories.has(event.category)) return null;
  const meta = IMPORTANCE_META[event.importance];
  const base = {
    id: event.id,
    title: event.title,
    allDay: event.allDay,
    // FullCalendar v7 classic theme reads --fc-event-color /
    // --fc-event-contrast-color; our CSS turns the fill translucent.
    color: meta.color,
    contrastColor: "#edf0f4",
    extendedProps: {
      importance: event.importance,
      category: event.category,
      notes: event.notes ?? "",
      recurrence: event.recurrence,
      plannerId: event.id,
    },
  };

  const rrule = rruleFor(event.recurrence, event.start);
  if (rrule) {
    return {
      ...base,
      rrule,
      duration: toDurationString(event.start, event.end),
      exdate: event.exdates ?? [],
    };
  }
  return { ...base, start: event.start, end: event.end };
}

export function shiftIsoByDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Shift one event (single or whole recurring series) by N days. */
export function shiftEventByDays(
  events: PlannerEvent[],
  id: string,
  days: number,
): PlannerEvent[] {
  return events.map((e) =>
    e.id === id
      ? {
          ...e,
          start: shiftIsoByDays(e.start, days),
          end: shiftIsoByDays(e.end, days),
        }
      : e,
  );
}

/** Push all future events of a category by N days (recovery use-case). */
export function shiftCategoryFutureByDays(
  events: PlannerEvent[],
  category: Category,
  days: number,
  fromDate: Date = new Date(),
): PlannerEvent[] {
  const from = fromDate.getTime();
  return events.map((e) => {
    if (e.category !== category) return e;
    if (new Date(e.start).getTime() < from && e.recurrence === "none")
      return e;
    // Recurring series: shift dtstart so all future occurrences move.
    return {
      ...e,
      start: shiftIsoByDays(e.start, days),
      end: shiftIsoByDays(e.end, days),
    };
  });
}

/** Skip a single occurrence of a recurring series. */
export function skipOccurrence(
  events: PlannerEvent[],
  id: string,
  occurrenceStartIso: string,
): PlannerEvent[] {
  return events.map((e) =>
    e.id === id
      ? { ...e, exdates: [...(e.exdates ?? []), occurrenceStartIso] }
      : e,
  );
}
