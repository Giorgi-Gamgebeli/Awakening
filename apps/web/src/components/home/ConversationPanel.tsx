import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink } from "react-router";
import {
  Apple,
  NotebookPen,
  Bot,
  CalendarDays,
  MessageCircle,
  Plus,
  Pin,
  UsersRound,
} from "lucide-react";
import { focusRing, groups } from "./constants";
import { orpc } from "../../lib/orpc";

type ConversationPanelProps = Readonly<{
  mobileOpen: boolean;
  onClose: () => void;
}>;

export function ConversationPanel({
  mobileOpen,
  onClose,
}: ConversationPanelProps) {
  const firstNavigationItemRef = useRef<HTMLAnchorElement>(null);
  const sessionsQuery = useQuery(
    orpc.agent.sessions.list.queryOptions({ input: { limit: 30 } }),
  );
  const pinnedSessions = (sessionsQuery.data?.items ?? []).filter(
    (session) => session.isPinned,
  );

  useEffect(() => {
    if (!mobileOpen) return;

    const focusTimer = window.setTimeout(
      () => firstNavigationItemRef.current?.focus(),
      0,
    );

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen, onClose]);

  return (
    <>
      <aside
        id="conversation-navigation"
        className={`home-mobile-drawer home-conversation-panel bg-ink-950! flex w-80 shrink-0 flex-col border-border-subtle transition-transform duration-300 ease-out max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-30 max-md:w-[min(21rem,calc(100vw-3rem))] max-md:overflow-y-auto max-md:shadow-[1.5rem_0_5rem_color-mix(in_srgb,var(--color-shadow)_62%,transparent)] ${
          mobileOpen
            ? "max-md:visible max-md:translate-x-0"
            : "max-md:invisible max-md:pointer-events-none max-md:-translate-x-full"
        }`}
        aria-label="Workspace navigation"
      >
        <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Workspace">
          <NavLink
            ref={firstNavigationItemRef}
            to="/home/calendar"
            onClick={onClose}
            className={({ isActive }) =>
              `flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors active:scale-[0.99] ${focusRing} ${
                isActive
                  ? "home-selected-surface border-system/32 text-content shadow-[inset_3px_0_0_var(--color-system)]"
                  : "border-transparent text-content-muted hover:border-border hover:bg-surface-raised hover:text-content"
              }`
            }
          >
            <CalendarDays size={18} aria-hidden="true" />
            Calendar
          </NavLink>
          <button
            type="button"
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-content-muted transition-colors hover:bg-surface-raised hover:text-content active:scale-[0.99] ${focusRing}`}
          >
            <Apple size={18} aria-hidden="true" />
            Nutrition
          </button>
          <button
            type="button"
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-content-muted transition-colors hover:bg-surface-raised hover:text-content active:scale-[0.99] ${focusRing}`}
          >
            <NotebookPen size={18} aria-hidden="true" />
            Notes
          </button>
          <div className="group relative min-h-12">
            <NavLink
              to="/home/ai"
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 pr-12 text-sm font-semibold transition-colors active:scale-[0.99] ${focusRing} ${
                  isActive
                    ? "home-selected-surface text-content shadow-[inset_3px_0_0_var(--color-system)]"
                    : "text-content-muted hover:bg-surface-raised hover:text-content"
                }`
              }
            >
              <Bot size={18} aria-hidden="true" />
              System
            </NavLink>
            <Link
              to="/home/ai/new"
              onClick={onClose}
              className={`absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-content-subtle opacity-0 transition-[opacity,color,background-color] hover:bg-surface-raised hover:text-system group-hover:opacity-100 group-focus-within:opacity-100 active:scale-[0.99] ${focusRing}`}
              aria-label="Start a new system chat"
              title="New system chat"
            >
              <Plus size={18} aria-hidden="true" />
            </Link>
          </div>
          {pinnedSessions.length ? (
            <div
              className="ml-4 border-l border-border-subtle py-1 pl-2"
              aria-label="Pinned system sessions"
            >
              {pinnedSessions.map((session) => (
                <NavLink
                  key={session.id}
                  to={`/home/ai/${session.id}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${focusRing} ${
                      isActive
                        ? "home-selected-surface font-semibold text-content"
                        : "text-content-muted hover:bg-surface-raised hover:text-content"
                    }`
                  }
                >
                  <Pin size={14} className="shrink-0 text-system" aria-hidden="true" />
                  <span className="truncate">{session.title}</span>
                </NavLink>
              ))}
            </div>
          ) : null}
          <NavLink
            to="/home/friends"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors active:scale-[0.99] ${focusRing} ${
                isActive
                  ? "home-selected-surface border-system/32 text-content shadow-[inset_3px_0_0_var(--color-system)]"
                  : "border-transparent text-content-muted hover:border-border hover:bg-surface-raised hover:text-content"
              }`
            }
          >
            <UsersRound className="text-system" size={18} aria-hidden="true" />
            Friends
          </NavLink>
          <button
            type="button"
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-content-muted transition-colors hover:bg-surface-raised hover:text-content active:scale-[0.99] ${focusRing}`}
          >
            <MessageCircle size={18} aria-hidden="true" />
            Groups
          </button>
        </nav>

        <section
          className="px-3 pb-3"
          aria-label={`${groups.length} group chats`}
        >
          <div className="grid gap-1">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-raised active:scale-[0.99] ${focusRing}`}
              >
                <span className="grid size-9 place-items-center rounded-xl bg-surface text-[0.62rem] font-bold text-content-muted">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-content">
                    {group.name}
                  </span>
                  <span className="block text-xs text-content-subtle">
                    {group.members} members
                  </span>
                </span>
                <MessageCircle
                  size={16}
                  className="text-content-subtle"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>

        <div className="mt-auto border-t border-border-subtle p-3">
          <Link
            to="/home/settings"
            onClick={onClose}
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-content-muted transition-colors hover:bg-surface-raised hover:text-content active:scale-[0.99] ${focusRing}`}
            aria-label="Open profile"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-surface font-mono text-xs font-bold text-content-muted">
              R
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                Your profile
              </span>
              <span className="block text-xs text-content-subtle">
                Account settings
              </span>
            </span>
          </Link>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-shadow/65 backdrop-blur-[2px] md:hidden"
          aria-label="Close conversation navigation"
        />
      ) : null}
    </>
  );
}
