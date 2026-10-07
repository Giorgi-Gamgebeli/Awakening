import { useCallback, useLayoutEffect, useRef } from "react";

const SLIDE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SLIDE_MS = 380;

/**
 * FLIP slide for calendar events.
 *
 * Call `snapshot()` right BEFORE the events array changes (drag start,
 * +1 day, dialog save…), and after React re-renders each event glides
 * from its old rect to its new one instead of jumping.
 */
export function useFlipSlide(eventsVersion: unknown) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef(new Map<string, DOMRect[]>());

  const snapshot = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const map = new Map<string, DOMRect[]>();
    root.querySelectorAll<HTMLElement>("[data-planner-id]").forEach((el) => {
      const id = el.dataset["plannerId"];
      if (!id) return;
      const list = map.get(id) ?? [];
      list.push(el.getBoundingClientRect());
      map.set(id, list);
    });
    fromRef.current = map;
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const from = fromRef.current;
    fromRef.current = new Map();
    if (!root || from.size === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    root.querySelectorAll<HTMLElement>("[data-planner-id]").forEach((el) => {
      const id = el.dataset["plannerId"];
      if (!id) return;
      const rects = from.get(id);
      const prev = rects?.shift();
      if (!prev) return;
      const next = el.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      const target = el.closest(".fc-event, .fc-list-event") ?? el;
      target.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: SLIDE_MS, easing: SLIDE_EASE },
      );
    });
  }, [eventsVersion]);

  return { rootRef, snapshot };
}
