import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Bot,
  Trash2,
} from "lucide-react";
import { focusRing } from "./constants";

export type AgentSessionItem = Readonly<{
  id: string;
  title: string;
  model: string | null;
  isPinned: boolean;
  lastMessageAt: Date | string;
  messageCount: number;
}>;

type Props = Readonly<{
  layout?: "sidebar" | "page";
  sessions: AgentSessionItem[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onSetPinned: (id: string, isPinned: boolean) => void;
  onDelete: (id: string) => void;
}>;

function formatDate(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AgentSessionsPanel({
  layout = "sidebar",
  sessions,
  activeId,
  isLoading,
  onSelect,
  onNew,
  onRename,
  onSetPinned,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function startRename(session: AgentSessionItem) {
    setEditingId(session.id);
    setDraft(session.title);
  }

  function commitRename(id: string) {
    const title = draft.trim();
    if (title) onRename(id, title);
    setEditingId(null);
  }

  return (
    <aside
      aria-label="Agent chats"
      className={`flex flex-col ${
        layout === "page"
          ? "w-full"
          : "w-72 shrink-0 border-r border-border-subtle bg-ink-950/60 max-md:hidden"
      }`}
    >
      {layout === "sidebar" ? (
        <div className="p-3">
          <button
            type="button"
            onClick={onNew}
            className={`flex min-h-11 w-full items-center gap-2 rounded-xl bg-system px-3 text-sm font-semibold text-on-system transition-transform active:scale-[0.99] ${focusRing}`}
          >
            <MessageSquarePlus size={17} aria-hidden="true" />
            New chat
          </button>
        </div>
      ) : null}

      <div
        className={`min-h-0 flex-1 overflow-y-auto ${
          layout === "page"
            ? "divide-y divide-border-subtle border-y border-border-subtle"
            : "px-2 pb-3"
        }`}
        role="list"
      >
        {isLoading ? (
          <p className="px-3 py-6 text-center text-xs text-content-subtle">
            Loading chats…
          </p>
        ) : sessions.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-content-subtle">
            No chats yet. Start a new one.
          </p>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeId;
            const isEditing = editingId === session.id;
            return (
              <div
                key={session.id}
                role="listitem"
                className={`group flex items-center gap-1 ${
                  layout === "page"
                    ? "min-h-18 px-2 py-3 transition-[background-color,transform] hover:bg-surface"
                    : "rounded-xl px-1 py-0.5"
                } ${
                  isActive && layout === "sidebar" ? "bg-surface-raised" : ""
                }`}
              >
                {isEditing ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-1 p-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      commitRename(session.id);
                    }}
                  >
                    <label className="sr-only" htmlFor={`rename-${session.id}`}>
                      Rename chat
                    </label>
                    <input
                      id={`rename-${session.id}`}
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => commitRename(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      maxLength={120}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-content"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(session.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={`min-w-0 flex-1 text-left ${focusRing} ${
                      layout === "page"
                        ? "flex min-h-12 items-center gap-4 px-0 py-0"
                        : "rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-raised"
                    } ${
                      isActive && layout === "sidebar" ? "bg-surface-raised" : ""
                    }`}
                  >
                    {layout === "page" ? (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-system/14 text-system">
                        <Bot size={21} aria-hidden="true" />
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-content">
                        {session.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-content-subtle">
                        {formatDate(session.lastMessageAt)} · {session.messageCount} msgs
                        {session.model ? ` · ${session.model}` : ""}
                      </span>
                    </span>
                  </button>
                )}

                {!isEditing && (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                      aria-label={`Chat options for ${session.title}`}
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-content-subtle opacity-0 transition-opacity hover:bg-surface hover:text-content group-hover:opacity-100 focus-visible:opacity-100 ${focusRing} ${
                        isActive ? "opacity-100" : ""
                      }`}
                    >
                      <MoreHorizontal size={16} aria-hidden="true" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        side="right"
                        align="start"
                        sideOffset={6}
                        className="z-50 min-w-44 rounded-xl border border-border bg-surface-raised p-1 shadow-xl"
                      >
                        <DropdownMenu.Item
                          onSelect={() => startRename(session)}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-content outline-none hover:bg-surface ${focusRing}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Rename
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() =>
                            onSetPinned(session.id, !session.isPinned)
                          }
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-content outline-none hover:bg-surface ${focusRing}`}
                        >
                          {session.isPinned ? (
                            <PinOff size={14} aria-hidden="true" />
                          ) : (
                            <Pin size={14} aria-hidden="true" />
                          )}
                          {session.isPinned ? "Unpin" : "Pin"}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => onDelete(session.id)}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-danger outline-none hover:bg-surface"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
