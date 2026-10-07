export type Importance = "low" | "normal" | "high" | "urgent";

export type Category = "general" | "workout" | "climbing" | "work" | "personal";

export type RecurrencePreset =
  | "none"
  | "daily"
  | "weekly"
  | "every2weeks"
  | "every3weeks"
  | "weekdays";

export interface PlannerEvent {
  id: string;
  title: string;
  /** ISO string for one-off events (start). For recurring, dtstart. */
  start: string;
  /** ISO string for one-off events (end). For recurring, dtstart + duration. */
  end: string;
  allDay: boolean;
  importance: Importance;
  category: Category;
  notes?: string;
  recurrence: RecurrencePreset;
  /** Dates (ISO) to skip for recurring series (exdate). */
  exdates?: string[];
}

export interface EventDraft {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  importance: Importance;
  category: Category;
  notes: string;
  recurrence: RecurrencePreset;
}

export const IMPORTANCE_META: Record<
  Importance,
  { label: string; color: string; bg: string }
> = {
  low: { label: "Low", color: "#949fad", bg: "rgba(148,159,173,0.14)" },
  normal: { label: "Normal", color: "#7fb9e3", bg: "rgba(127,185,227,0.16)" },
  high: { label: "High", color: "#cfb47d", bg: "rgba(207,180,125,0.18)" },
  urgent: { label: "Urgent", color: "#ee918b", bg: "rgba(238,145,139,0.20)" },
};

export const CATEGORY_META: Record<Category, { label: string }> = {
  general: { label: "General" },
  workout: { label: "Workout" },
  climbing: { label: "Climbing" },
  work: { label: "Work" },
  personal: { label: "Personal" },
};

export const RECURRENCE_META: Record<RecurrencePreset, { label: string }> = {
  none: { label: "Does not repeat" },
  daily: { label: "Daily" },
  weekly: { label: "Weekly" },
  every2weeks: { label: "Every 2 weeks" },
  every3weeks: { label: "Every 3 weeks (climbing)" },
  weekdays: { label: "Weekdays (Mon–Fri)" },
};
