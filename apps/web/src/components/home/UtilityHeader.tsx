import { Menu } from "lucide-react";
import { focusRing } from "./constants";
import type { MobileNavigationProps } from "./types";

type UtilityHeaderProps = MobileNavigationProps &
  Readonly<{
    title: string;
    subtitle: string;
    children?: React.ReactNode;
  }>;

export function UtilityHeader({
  title,
  subtitle,
  children,
  onOpenMenu,
  menuButtonRef,
  menuOpen,
}: UtilityHeaderProps) {
  return (
    <header className="home-utility-header flex min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border-subtle px-4 py-3 sm:px-7 sm:py-4">
      <div className="flex items-center gap-3">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          className={`grid size-11 shrink-0 place-items-center rounded-xl text-content-muted transition-colors hover:bg-surface-raised hover:text-system md:hidden ${focusRing}`}
          aria-label="Open conversations"
          aria-controls="conversation-navigation"
          aria-expanded={menuOpen}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div>
          <p className="text-sm font-medium text-content-subtle">{subtitle}</p>
          <h1 className="mt-1 text-balance font-display text-xl font-extrabold tracking-wide text-content">
            {title}
          </h1>
        </div>
      </div>
      {children}
    </header>
  );
}
