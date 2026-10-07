import { Menu } from "lucide-react";
import { focusRing } from "./constants";
import type { MobileNavigationProps } from "./types";

type UtilityHeaderProps = Partial<MobileNavigationProps> &
  Readonly<{
    title: string;
    subtitle?: string;
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
  const showMenuButton = typeof onOpenMenu === "function";
  return (
    <header className="home-utility-header rounded-tl-2xl flex min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-border-subtle border-b px-4 py-3 sm:px-7 sm:py-4">
      <div className="flex items-center gap-3">
        {showMenuButton ? (
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onOpenMenu}
            className={`grid size-11 shrink-0 place-items-center rounded-xl text-content-muted transition-colors hover:bg-surface-raised hover:text-system md:hidden ${focusRing}`}
            aria-label="Open workspace navigation"
            aria-controls="conversation-navigation"
            aria-expanded={menuOpen ?? false}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        ) : null}
        <div>
          {subtitle ? (
            <p className="text-sm font-medium text-content-subtle">{subtitle}</p>
          ) : null}
          <h1 className="mt-1 text-balance font-display text-xl font-extrabold tracking-wide text-content">
            {title}
          </h1>
        </div>
      </div>
      {children}
    </header>
  );
}
