import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DateSelectInfo,
  EventClickInfo,
  EventDragStartInfo,
  EventDropInfo,
  EventResizeDoneInfo,
  EventResizeStartInfo,
} from "@fullcalendar/react";
import { AnimatePresence } from "framer-motion";
import { CalendarDays, Plus } from "lucide-react";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
import { ConversationPanel, UtilityHeader } from "../components/home";
import { focusRing } from "../components/home/constants";
import { CalendarView } from "../components/calendar/CalendarView";
import {
  EventDialog,
  type DialogState,
} from "../components/calendar/EventDialog";
import { useFlipSlide } from "../components/calendar/useFlipSlide";
import {
  CATEGORY_META,
  IMPORTANCE_META,
  type Category,
  type EventDraft,
  type Importance,
  type CalendarEvent,
} from "../components/calendar/types";
import { shiftIsoByDays } from "../components/calendar/store";
import { orpc } from "../lib/orpc";
import "./CalendarPage.css";
import "./HomePage.css";

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as Category[];

function toIso(value: Date | string) {
  return new Date(value).toISOString();
}

export default function CalendarPage() {
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const calendarEventsQuery = useQuery({
    ...orpc.calendarEvents.list.queryOptions({ input: {} }),
    refetchInterval: 5_000,
  });
  const calendarEventsQueryKey = orpc.calendarEvents.list.queryKey({ input: {} });
  const createEventMutation = useMutation(
    orpc.calendarEvents.create.mutationOptions(),
  );
  const patchEventMutation = useMutation(
    orpc.calendarEvents.patch.mutationOptions(),
  );
  const deleteEventMutation = useMutation(
    orpc.calendarEvents.delete.mutationOptions(),
  );
  const events = useMemo<CalendarEvent[]>(
    () =>
      (calendarEventsQuery.data ?? []).map((event) => ({
        id: event.id,
        title: event.title,
        start: toIso(event.startAt),
        end: toIso(event.endAt),
        allDay: event.allDay,
        importance: event.importance,
        category: event.category,
        notes: event.notes ?? undefined,
        recurrence: event.recurrence,
        exdates: event.excludedStarts.map(toIso),
      })),
    [calendarEventsQuery.data],
  );
  const { rootRef: calendarRootRef, snapshot } = useFlipSlide(events);
  const [visibleCategories, setVisibleCategories] = useState<Set<Category>>(
    () => new Set(ALL_CATEGORIES),
  );
  const [weekends, setWeekends] = useState(true);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => {
    document.title = "Calendar | Awakening";
  }, []);

  const closeMobilePanel = useCallback(() => {
    setMobilePanelOpen(false);
    requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
  }, []);

  function refreshCalendarEvents() {
    return queryClient.invalidateQueries({ queryKey: calendarEventsQueryKey });
  }

  const toggleCategory = useCallback((category: Category) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleSelect = useCallback((arg: DateSelectInfo) => {
    const startIso = arg.start.toISOString();
    const endIso = arg.end.toISOString();
    setDialog({
      mode: "create",
      draft: {
        title: "",
        start: startIso,
        end: endIso,
        allDay: arg.allDay,
        importance: "normal",
        category: "general",
        notes: "",
        recurrence: "none",
      },
    });
    arg.view.calendar.unselect();
  }, []);

  const handleEventClick = useCallback(
    (arg: EventClickInfo) => {
      const base = events.find((e) => e.id === arg.event.id);
      if (!base) return;
      setDialog({
        mode: "edit",
        eventId: base.id,
        occurrenceStartIso: arg.event.start?.toISOString() ?? base.start,
        isRecurring: base.recurrence !== "none",
        draft: {
          title: base.title,
          start: base.start,
          end: base.end,
          allDay: base.allDay,
          importance: base.importance,
          category: base.category,
          notes: base.notes ?? "",
          recurrence: base.recurrence,
        },
      });
    },
    [events],
  );

  const handleDrop = useCallback(
    (arg: EventDropInfo) => {
      const base = events.find((e) => e.id === arg.event.id);
      if (!base) {
        arg.revert();
        return;
      }
      const newStart = arg.event.start?.toISOString();
      const newEnd = arg.event.end?.toISOString();
      if (!newStart || !newEnd) {
        arg.revert();
        return;
      }
      if (base.recurrence !== "none") {
        // Dragging an occurrence moves the whole series by the delta.
        const oldOcc = arg.oldEvent.start?.getTime() ?? 0;
        const newOcc = arg.event.start?.getTime() ?? 0;
        const deltaDays = Math.round((newOcc - oldOcc) / 86_400_000);
        patchEventMutation.mutate(
          {
            id: base.id,
            startAt: new Date(shiftIsoByDays(base.start, deltaDays)),
            endAt: new Date(shiftIsoByDays(base.end, deltaDays)),
          },
          { onSuccess: () => void refreshCalendarEvents() },
        );
      } else {
        patchEventMutation.mutate(
          {
            id: base.id,
            startAt: new Date(newStart),
            endAt: new Date(newEnd),
            allDay: arg.event.allDay,
          },
          { onSuccess: () => void refreshCalendarEvents() },
        );
      }
    },
    [events, patchEventMutation],
  );

  const handleResize = useCallback(
    (arg: EventResizeDoneInfo) => {
      const base = events.find((e) => e.id === arg.event.id);
      if (!base) {
        arg.revert();
        return;
      }
      const newStart = arg.event.start?.toISOString();
      const newEnd = arg.event.end?.toISOString();
      if (!newStart || !newEnd) {
        arg.revert();
        return;
      }
      // Resizing a recurring occurrence changes the series duration.
      patchEventMutation.mutate(
        {
          id: base.id,
          ...(base.recurrence === "none"
            ? { startAt: new Date(newStart) }
            : {}),
          endAt: new Date(newEnd),
        },
        { onSuccess: () => void refreshCalendarEvents() },
      );
    },
    [events, patchEventMutation],
  );

  const handleSave = useCallback(
    (draft: EventDraft) => {
      if (!dialog) return;
      snapshot();
      if (dialog.mode === "create") {
        createEventMutation.mutate(
          {
            title: draft.title.trim() || "Untitled",
            startAt: new Date(draft.start),
            endAt: new Date(draft.end),
            allDay: draft.allDay,
            importance: draft.importance,
            category: draft.category,
            notes: draft.notes || null,
            recurrence: draft.recurrence,
          },
          { onSuccess: () => void refreshCalendarEvents() },
        );
      } else if (dialog.eventId) {
        const id = dialog.eventId;
        patchEventMutation.mutate(
          {
            id,
            title: draft.title.trim() || "Untitled",
            startAt: new Date(draft.start),
            endAt: new Date(draft.end),
            allDay: draft.allDay,
            importance: draft.importance,
            category: draft.category,
            notes: draft.notes || null,
            recurrence: draft.recurrence,
          },
          { onSuccess: () => void refreshCalendarEvents() },
        );
      }
      setDialog(null);
    },
    [createEventMutation, dialog, patchEventMutation, snapshot],
  );

  const handleDelete = useCallback(() => {
    if (!dialog?.eventId) return;
    const id = dialog.eventId;
    snapshot();
    deleteEventMutation.mutate(
      { id },
      {
        onSuccess: () => void refreshCalendarEvents(),
      },
    );
    setDialog(null);
  }, [deleteEventMutation, dialog, snapshot]);

  const handleShiftDays = useCallback(
    (days: number) => {
      if (!dialog?.eventId) return;
      const id = dialog.eventId;
      const event = events.find((item) => item.id === id);
      if (!event) return;
      snapshot();
      patchEventMutation.mutate(
        {
          id,
          startAt: new Date(shiftIsoByDays(event.start, days)),
          endAt: new Date(shiftIsoByDays(event.end, days)),
        },
        { onSuccess: () => void refreshCalendarEvents() },
      );
      setDialog((d) =>
        d
          ? {
              ...d,
              draft: {
                ...d.draft,
                start: shiftIsoByDays(d.draft.start, days),
                end: shiftIsoByDays(d.draft.end, days),
              },
            }
          : d,
      );
    },
    [dialog, events, patchEventMutation, snapshot],
  );

  const handleSkipOccurrence = useCallback(() => {
    if (!dialog?.eventId || !dialog.occurrenceStartIso) return;
    const event = events.find((item) => item.id === dialog.eventId);
    if (!event) return;
    snapshot();
    patchEventMutation.mutate(
      {
        id: event.id,
        excludedStarts: [
          ...(event.exdates ?? []),
          dialog.occurrenceStartIso,
        ].map((value) => new Date(value)),
      },
      { onSuccess: () => void refreshCalendarEvents() },
    );
    setDialog(null);
  }, [dialog, events, patchEventMutation, snapshot]);

  /** Recovery: push all future workouts 1 day later. */
  const handleRecoverWorkouts = useCallback(() => {
    snapshot();
    for (const event of events) {
      if (
        event.category !== "workout" ||
        (event.recurrence === "none" && new Date(event.start) < new Date())
      ) {
        continue;
      }
      patchEventMutation.mutate({
        id: event.id,
        startAt: new Date(shiftIsoByDays(event.start, 1)),
        endAt: new Date(shiftIsoByDays(event.end, 1)),
      });
    }
    void refreshCalendarEvents();
  }, [events, patchEventMutation, snapshot]);

  /** Snapshot positions at drag/resize start so the drop glides home. */
  const handleMoveStart = useCallback(
    (_arg: EventDragStartInfo | EventResizeStartInfo) => {
      snapshot();
    },
    [snapshot],
  );

  const counts = useMemo(() => {
    const map = new Map<Category, number>();
    for (const e of events) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return map;
  }, [events]);

  const legend = useMemo(
    () =>
      (
        Object.entries(IMPORTANCE_META) as [
          Importance,
          { label: string; color: string },
        ][]
      ).map(([key, meta]) => ({ key, ...meta })),
    [],
  );

  return (
    <div className="home-shell flex min-h-[100dvh] font-body text-content antialiased">
      <a
        href="#calendar-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-system focus:px-3 focus:py-2 focus:text-on-system"
      >
        Skip to content
      </a>
      <div className="flex min-w-0 flex-1">
        <ConversationPanel
          mobileOpen={mobilePanelOpen}
          onClose={closeMobilePanel}
        />
        <main
          id="calendar-content"
          className="home-main rounded-tl-2xl flex min-w-0 flex-1 flex-col"
        >
          <UtilityHeader
            title="Calendar"
            onOpenMenu={() => setMobilePanelOpen(true)}
            menuButtonRef={mobileMenuButtonRef}
            menuOpen={mobilePanelOpen}
          >
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekends((w) => !w)}
                aria-pressed={weekends}
                className={`inline-flex min-h-11 items-center rounded-xl border px-3 py-2 text-xs font-bold transition-colors active:scale-[0.98] ${focusRing} ${
                  weekends
                    ? "border-system/40 bg-system/10 text-content"
                    : "border-border bg-surface text-content-muted hover:text-content"
                }`}
              >
                <CalendarDays size={15} aria-hidden="true" className="mr-1.5" />
                Weekends
              </button>
              <button
                type="button"
                onClick={handleRecoverWorkouts}
                title="Push all future workouts 1 day later (recovery)"
                className={`inline-flex min-h-11 items-center rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-content transition-colors hover:bg-surface-raised active:scale-[0.98] ${focusRing}`}
              >
                Workouts +1 day
              </button>
              <button
                type="button"
                onClick={() =>
                  setDialog({
                    mode: "create",
                    draft: {
                      title: "",
                      start: new Date().toISOString(),
                      end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                      allDay: false,
                      importance: "normal",
                      category: "general",
                      notes: "",
                      recurrence: "none",
                    },
                  })
                }
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-system px-3 py-2 text-xs font-bold text-on-system transition-colors hover:bg-system-hover active:scale-[0.98] ${focusRing}`}
              >
                <Plus size={15} aria-hidden="true" />
                New event
              </button>
            </div>
          </UtilityHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
            {calendarEventsQuery.isLoading ? (
              <p className="text-sm text-content-subtle">Loading calendar…</p>
            ) : null}
            {calendarEventsQuery.isError ? (
              <p role="alert" className="text-sm text-danger">
                Could not load calendar events.
              </p>
            ) : null}
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filter by category"
            >
              {ALL_CATEGORIES.map((cat) => {
                const active = visibleCategories.has(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={active}
                    className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors active:scale-[0.98] ${focusRing} ${
                      active
                        ? "border-system/45 bg-system/12 text-content"
                        : "border-border bg-surface text-content-subtle hover:text-content"
                    }`}
                  >
                    {CATEGORY_META[cat].label}
                    <span className="ml-1.5 opacity-60">
                      {counts.get(cat) ?? 0}
                    </span>
                  </button>
                );
              })}
              <span
                className="ml-auto hidden items-center gap-3 text-[11px] text-content-subtle lg:flex"
                aria-label="Importance legend"
              >
                {legend.map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    {item.label}
                  </span>
                ))}
              </span>
            </div>

            <div
              ref={calendarRootRef}
              className="calendar-wrap home-control-surface min-h-0 flex-1 rounded-2xl border border-border-subtle p-3 sm:p-4"
            >
              <CalendarView
                events={events}
                visibleCategories={visibleCategories}
                weekends={weekends}
                onSelect={handleSelect}
                onEventClick={handleEventClick}
                onDrop={handleDrop}
                onResize={handleResize}
                onDragStart={handleMoveStart}
                onResizeStart={handleMoveStart}
              />
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {dialog ? (
          <EventDialog
            state={dialog}
            onClose={() => setDialog(null)}
            onSave={handleSave}
            onDelete={dialog.mode === "edit" ? handleDelete : undefined}
            onShiftDays={dialog.mode === "edit" ? handleShiftDays : undefined}
            onSkipOccurrence={
              dialog.mode === "edit" && dialog.isRecurring
                ? handleSkipOccurrence
                : undefined
            }
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
