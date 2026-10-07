import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CATEGORY_META,
  IMPORTANCE_META,
  RECURRENCE_META,
  type Category,
  type EventDraft,
  type Importance,
  type RecurrencePreset,
} from "./types";
import { focusRing } from "../home/constants";
import { systemEase } from "../../animations/shared";

export interface DialogState {
  mode: "create" | "edit";
  /** Base event id when editing. */
  eventId?: string;
  /** Occurrence start ISO when editing a recurring occurrence. */
  occurrenceStartIso?: string;
  /** True if the edited event is recurring. */
  isRecurring?: boolean;
  draft: EventDraft;
}

interface EventDialogProps {
  state: DialogState;
  onClose: () => void;
  onSave: (draft: EventDraft) => void;
  onDelete?: () => void;
  onShiftDays?: (days: number) => void;
  onSkipOccurrence?: () => void;
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const inputClass = `h-11 w-full rounded-xl border border-border-subtle bg-canvas/45 px-3 text-sm text-content outline-none placeholder:text-content-subtle focus:border-system focus:ring-1 focus:ring-system/45 ${focusRing}`;

export function EventDialog({
  state,
  onClose,
  onSave,
  onDelete,
  onShiftDays,
  onSkipOccurrence,
}: EventDialogProps) {
  const [draft, setDraft] = useState<EventDraft>(state.draft);

  useEffect(() => {
    setDraft(state.draft);
  }, [state]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center bg-shadow/70 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.18 } }}
      exit={{ opacity: 0, transition: { duration: 0.14 } }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={state.mode === "create" ? "New event" : "Edit event"}
        className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-[0_2rem_7rem_var(--color-shadow),0_0_3rem_color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.32, ease: systemEase },
        }}
        exit={{
          opacity: 0,
          y: 8,
          scale: 0.99,
          transition: { duration: 0.16, ease: "linear" },
        }}
      >
        <h2 className="font-display text-lg font-extrabold tracking-wide text-content">
          {state.mode === "create" ? "New event" : "Edit event"}
        </h2>
        {state.isRecurring ? (
          <p className="mt-1 text-xs text-content-subtle">
            Recurring series — saving edits the whole series. Use “Skip this
            date” to skip one occurrence.
          </p>
        ) : null}

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-content-muted">
              What are you doing?
            </span>
            <input
              className={inputClass}
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Workout — pull day"
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Category
              </span>
              <select
                className={inputClass}
                value={draft.category}
                onChange={(e) => set("category", e.target.value as Category)}
              >
                {(
                  Object.entries(CATEGORY_META) as [Category, { label: string }][]
                ).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Importance
              </span>
              <select
                className={inputClass}
                value={draft.importance}
                onChange={(e) =>
                  set("importance", e.target.value as Importance)
                }
              >
                {(
                  Object.entries(IMPORTANCE_META) as [
                    Importance,
                    { label: string },
                  ][]
                ).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-content-muted">
            <input
              type="checkbox"
              checked={draft.allDay}
              onChange={(e) => set("allDay", e.target.checked)}
              className="size-4 accent-[#7fb9e3]"
            />
            All-day
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Start
              </span>
              <input
                type="datetime-local"
                className={inputClass}
                value={toLocalInputValue(draft.start)}
                onChange={(e) => set("start", fromLocalInputValue(e.target.value))}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                End
              </span>
              <input
                type="datetime-local"
                className={inputClass}
                value={toLocalInputValue(draft.end)}
                onChange={(e) => set("end", fromLocalInputValue(e.target.value))}
              />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-content-muted">
              Repeat
            </span>
            <select
              className={inputClass}
              value={draft.recurrence}
              onChange={(e) =>
                set("recurrence", e.target.value as RecurrencePreset)
              }
            >
              {(
                Object.entries(RECURRENCE_META) as [
                  RecurrencePreset,
                  { label: string },
                ][]
              ).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-content-muted">
              Notes (optional)
            </span>
            <textarea
              className={`${inputClass} min-h-20 py-2`}
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Sets, location, link…"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => draft.title.trim() && onSave(draft)}
            className={`inline-flex min-h-11 items-center rounded-xl bg-system px-4 py-2 text-xs font-bold text-on-system transition-colors hover:bg-system-hover active:scale-[0.98] ${focusRing}`}
          >
            {state.mode === "create" ? "Add event" : "Save"}
          </button>
          {state.mode === "edit" && onShiftDays ? (
            <span
              className="inline-flex min-h-11 items-center rounded-xl border border-border bg-surface text-xs font-bold text-content"
              role="group"
              aria-label="Shift event by days"
            >
              <button
                type="button"
                onClick={() => onShiftDays(-1)}
                title="Move 1 day earlier"
                className={`rounded-l-xl px-3 py-2 transition-colors hover:bg-surface-raised active:scale-[0.97] ${focusRing}`}
              >
                −1
              </button>
              <span className="px-1 text-content-subtle" aria-hidden="true">
                day
              </span>
              <button
                type="button"
                onClick={() => onShiftDays(1)}
                title="Move 1 day later — recovery"
                className={`rounded-r-xl px-3 py-2 transition-colors hover:bg-surface-raised active:scale-[0.97] ${focusRing}`}
              >
                +1
              </button>
            </span>
          ) : null}
          {state.mode === "edit" && state.isRecurring && onSkipOccurrence ? (
            <button
              type="button"
              onClick={onSkipOccurrence}
              className={`inline-flex min-h-11 items-center rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-content transition-colors hover:bg-surface-raised active:scale-[0.98] ${focusRing}`}
            >
              Skip this date
            </button>
          ) : null}
          {state.mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className={`inline-flex min-h-11 items-center rounded-xl border border-[#ee918b]/40 bg-[#ee918b]/10 px-4 py-2 text-xs font-bold text-[#ee918b] transition-colors hover:bg-[#ee918b]/20 active:scale-[0.98] ${focusRing}`}
            >
              Delete
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={`ml-auto inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-xs font-bold text-content-muted transition-colors hover:text-content ${focusRing}`}
          >
            Cancel
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
