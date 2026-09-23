import { useState } from "react";
import { Link } from "react-router";
import { MessageCircle, Plus, UsersRound } from "lucide-react";
import { Avatar } from "./Avatar";
import { UtilityHeader } from "./UtilityHeader";
import { focusRing, filterOptions, friends, statusLabel } from "./constants";
import type { MobileNavigationProps } from "./types";

export function FriendsView(mobileNavigation: MobileNavigationProps) {
  const [filter, setFilter] = useState<"online" | "all" | "pending">("online");
  const visible =
    filter === "online"
      ? friends.filter((friend) => friend.status === "ONLINE")
      : filter === "pending"
        ? []
        : friends;

  return (
    <>
      <UtilityHeader
        title="Friends"
        subtitle="Keep up with the people you know"
        {...mobileNavigation}
      >
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          <fieldset className="home-filter-well flex min-h-11 rounded-xl border border-border-subtle p-1">
            <legend className="sr-only">Filter friends</legend>
            {filterOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize transition-colors sm:px-3 ${focusRing} ${
                  filter === item
                    ? "home-selected-surface text-content"
                    : "text-content-subtle hover:text-content"
                }`}
              >
                {item}
              </button>
            ))}
          </fieldset>
          <button
            type="button"
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-system px-3 py-2 text-xs font-bold text-on-system transition-colors hover:bg-system-hover active:scale-[0.98] ${focusRing}`}
          >
            <Plus size={16} aria-hidden="true" />
            Add friend
          </button>
        </div>
      </UtilityHeader>

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-7">
        {visible.length ? (
          <section
            className="w-full max-w-3xl"
            aria-labelledby="friend-list-title"
          >
            <h2
              id="friend-list-title"
              className="mb-3 text-sm font-semibold capitalize text-content-muted"
            >
              {filter} friends
            </h2>
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {visible.map((friend) => (
                <Link
                  key={friend.id}
                  to={`/home/${friend.id}`}
                  className={`group flex min-h-18 items-center gap-4 px-2 py-3 text-left transition-[background-color,transform] hover:bg-surface active:scale-[0.995] ${focusRing}`}
                >
                  <Avatar friend={friend} size="size-12" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-content">
                      {friend.userName}
                    </span>
                    <span className="mt-1 block text-xs text-content-subtle">
                      {statusLabel[friend.status]}
                    </span>
                  </span>
                  <MessageCircle
                    size={19}
                    className="text-content-subtle transition-colors group-hover:text-system"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="grid flex-1 place-items-center">
            <section
              className="max-w-sm text-center"
              aria-labelledby="empty-title"
            >
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-system/14 text-system">
                <UsersRound size={27} aria-hidden="true" />
              </div>
              <h2
                id="empty-title"
                className="mt-5 font-display text-xl font-bold tracking-wide text-content"
              >
                No friends online
              </h2>
              <p className="mt-2 text-sm leading-6 text-content-muted">
                Friends and requests will appear here.
              </p>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
