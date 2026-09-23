import { MessageCircle } from "lucide-react";
import { NavLink } from "react-router";
import { Avatar } from "./Avatar";
import { focusRing, statusLabel } from "./constants";
import type { Friend } from "./types";

type ConversationRowProps = Readonly<{
  friend: Friend;
  onSelect?: () => void;
}>;

export function ConversationRow({ friend, onSelect }: ConversationRowProps) {
  return (
    <NavLink
      to={`/home/${friend.id}`}
      onClick={onSelect}
      className={({ isActive }) =>
        `group flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors active:scale-[0.99] ${focusRing} ${
          isActive
            ? "home-selected-surface border-system/32 shadow-[inset_3px_0_0_var(--color-system)]"
            : "border-transparent hover:border-border hover:bg-surface-raised"
        }`
      }
    >
      <Avatar friend={friend} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-content">
          {friend.userName}
        </span>
        <span className="mt-0.5 block truncate text-xs text-content-subtle">
          {statusLabel[friend.status]}
        </span>
      </span>
      <MessageCircle
        className="text-content-subtle opacity-60 transition-[color,opacity] group-hover:text-system group-hover:opacity-100"
        size={17}
        aria-hidden="true"
      />
    </NavLink>
  );
}
