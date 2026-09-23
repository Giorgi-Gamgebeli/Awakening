import type { Friend, Group } from "./types";

export const friends: Friend[] = [
  {
    id: "1",
    userName: "northstar",
    status: "ONLINE",
    initials: "N",
    tone: "bg-system/18 text-system",
  },
  {
    id: "2",
    userName: "mossline",
    status: "IDLE",
    initials: "M",
    tone: "bg-accent/20 text-accent-bright",
  },
  {
    id: "3",
    userName: "afterimage",
    status: "OFFLINE",
    initials: "A",
    tone: "bg-surface text-content-muted",
  },
];

export const groups: Group[] = [
  { id: "design", name: "Design Room", members: 4 },
  { id: "weekend", name: "Weekend plans", members: 3 },
];

export const statusLabel: Record<"ONLINE" | "IDLE" | "OFFLINE", string> = {
  ONLINE: "Available",
  IDLE: "Away",
  OFFLINE: "Offline",
};

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export const filterOptions = ["online", "all", "pending"] as const;
