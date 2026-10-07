import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import type {
  DateSelectInfo,
  EventClickInfo,
  EventDisplayInfo,
  EventDragStartInfo,
  EventDropInfo,
  EventInput,
  EventResizeDoneInfo,
  EventResizeStartInfo,
} from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/classic";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";
import interactionPlugin from "@fullcalendar/react/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import { IMPORTANCE_META } from "./types";
import { toFullCalendarInput } from "./store";
import type { Category, PlannerEvent } from "./types";

interface PlannerCalendarProps {
  events: PlannerEvent[];
  visibleCategories: Set<Category>;
  weekends: boolean;
  onSelect: (arg: DateSelectInfo) => void;
  onEventClick: (arg: EventClickInfo) => void;
  onDrop: (arg: EventDropInfo) => void;
  onResize: (arg: EventResizeDoneInfo) => void;
  onDragStart: (arg: EventDragStartInfo) => void;
  onResizeStart: (arg: EventResizeStartInfo) => void;
}

function renderEventContent(arg: EventDisplayInfo) {
  const importance =
    (arg.event.extendedProps["importance"] as keyof typeof IMPORTANCE_META) ??
    "normal";
  const meta = IMPORTANCE_META[importance] ?? IMPORTANCE_META.normal;
  return (
    <span className="fc-planner-event" data-planner-id={arg.event.id}>
      <span
        className="fc-planner-dot"
        style={{ backgroundColor: meta.color }}
        aria-hidden="true"
      />
      <span className="fc-planner-time">{arg.timeText}</span>
      <span className="fc-planner-title">{arg.event.title}</span>
    </span>
  );
}

export function PlannerCalendar({
  events,
  visibleCategories,
  weekends,
  onSelect,
  onEventClick,
  onDrop,
  onResize,
  onDragStart,
  onResizeStart,
}: PlannerCalendarProps) {
  const fcEvents: EventInput[] = useMemo(
    () =>
      events
        .map((e) => toFullCalendarInput(e, visibleCategories))
        .filter((e): e is EventInput => e !== null),
    [events, visibleCategories],
  );

  return (
    <FullCalendar
      plugins={[
        themePlugin,
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin,
        rrulePlugin,
      ]}
      initialView="timeGridWeek"
      colorScheme="dark"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
      }}
      firstDay={1}
      weekends={weekends}
      editable
      selectable
      selectMirror
      dayMaxEvents
      nowIndicator
      eventContent={renderEventContent}
      events={fcEvents}
      select={onSelect}
      eventClick={onEventClick}
      eventDrop={onDrop}
      eventResize={onResize}
      eventDragStart={onDragStart}
      eventResizeStart={onResizeStart}
      height="auto"
    />
  );
}
