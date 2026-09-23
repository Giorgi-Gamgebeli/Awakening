import { useEffect, useRef } from "react";
import { NavLink } from "react-router";
import { FilePlus2, Plus, Search, UsersRound, X } from "lucide-react";
import { ConversationRow } from "./ConversationRow";
import { focusRing, friends, groups } from "./constants";
import type { Friend } from "./types";

type ConversationPanelProps = Readonly<{
  mobileOpen: boolean;
  onClose: () => void;
}>;

export function ConversationPanel({
  mobileOpen,
  onClose,
}: ConversationPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const focusTimer = window.setTimeout(
      () => closeButtonRef.current?.focus(),
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
        className={`home-mobile-drawer home-conversation-panel flex w-80 shrink-0 flex-col border-r border-border-subtle transition-transform duration-300 ease-out max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-30 max-md:w-[min(21rem,calc(100vw-3rem))] max-md:overflow-y-auto max-md:shadow-[1.5rem_0_5rem_color-mix(in_srgb,var(--color-shadow)_62%,transparent)] ${
          mobileOpen
            ? "max-md:visible max-md:translate-x-0"
            : "max-md:invisible max-md:pointer-events-none max-md:-translate-x-full"
        }`}
        aria-label="Conversations"
      >
        <div className="home-panel-toolbar h-21.25 border-b border-border-subtle px-4 pt-4 pb-4 sm:px-5 sm:pt-5">
          <button
            type="button"
            className={`home-control-surface flex min-h-11 w-full items-center gap-2 rounded-xl border border-border-strong px-3 py-2 text-left text-sm text-content-muted transition-colors hover:border-system hover:bg-surface-raised hover:text-content ${focusRing}`}
          >
            <Search size={16} aria-hidden="true" />
            Search messages
          </button>
        </div>

        <nav className="px-3 pt-3" aria-label="Conversation views">
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
        </nav>

        <section className="mt-5 px-3" aria-labelledby="direct-messages-title">
          <div className="mb-2 flex items-center justify-between px-2">
            <h2
              id="direct-messages-title"
              className="text-xs font-semibold text-content-muted"
            >
              Direct messages
            </h2>
            <span className="text-xs text-content-subtle">
              {friends.length}
            </span>
          </div>
          <div className="grid gap-1">
            {friends.map((friend: Friend) => (
              <ConversationRow
                key={friend.id}
                friend={friend}
                onSelect={onClose}
              />
            ))}
          </div>
        </section>

        <span className="mx-5 my-4 h-px bg-border" aria-hidden="true" />

        <section
          className="flex min-h-0 flex-1 flex-col px-3"
          aria-labelledby="group-chats-title"
        >
          <div className="mb-2 flex items-center justify-between px-2">
            <h2
              id="group-chats-title"
              className="text-xs font-semibold text-content-muted"
            >
              Group chats
            </h2>
            <button
              type="button"
              className={`grid size-10 place-items-center rounded-xl text-content-subtle transition-colors hover:bg-surface-raised hover:text-system ${focusRing}`}
              aria-label="Create group chat"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-1">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-raised ${focusRing}`}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-surface text-[0.62rem] font-bold text-content-muted">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-content-muted">
                    {group.name}
                  </span>
                  <span className="block text-xs text-content-subtle">
                    {group.members} members
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
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
