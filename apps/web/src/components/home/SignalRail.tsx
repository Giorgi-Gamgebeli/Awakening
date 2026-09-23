import { Bell, Settings2, UsersRound } from "lucide-react";
import { Link } from "react-router";
import { focusRing } from "./constants";

export function SignalRail() {
  return (
    <aside
      className="home-signal-rail flex w-20 shrink-0 flex-col items-center border-r border-border-subtle px-3 py-5 max-md:hidden"
      aria-label="Workspace shortcuts"
    >
      <Link
        to="/home/friends"
        className={`grid size-11 place-items-center rounded-xl bg-system text-on-system shadow-[0_8px_24px_color-mix(in_srgb,var(--color-system)_18%,transparent)] transition-transform active:scale-[0.98] ${focusRing}`}
        aria-label="Awakening home"
      >
        <span className="font-display text-sm font-black" aria-hidden="true">
          A
        </span>
      </Link>
      <span className="my-5 h-px w-8 bg-border" aria-hidden="true" />
      <div className="grid gap-2">
        <Link
          to="/home/friends"
          className={`grid size-11 place-items-center rounded-xl bg-system/14 text-system transition-colors hover:bg-system/22 active:scale-[0.98] ${focusRing}`}
          aria-label="Friends"
        >
          <UsersRound size={19} aria-hidden="true" />
        </Link>
        <button
          type="button"
          className={`grid size-11 place-items-center rounded-xl text-content-subtle transition-colors hover:bg-surface-raised hover:text-content active:scale-[0.98] ${focusRing}`}
          aria-label="Notifications"
        >
          <Bell size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`grid size-11 place-items-center rounded-xl text-content-subtle transition-colors hover:bg-surface-raised hover:text-content active:scale-[0.98] ${focusRing}`}
          aria-label="Settings"
        >
          <Settings2 size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-auto">
        <button
          type="button"
          className={`grid size-11 place-items-center rounded-xl bg-accent/16 font-mono text-xs font-bold text-accent-bright transition-colors hover:bg-accent/24 ${focusRing}`}
          aria-label="Open profile"
        >
          R
        </button>
      </div>
    </aside>
  );
}
