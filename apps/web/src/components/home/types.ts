import type { RefObject } from "react";

export type Status = "ONLINE" | "IDLE" | "OFFLINE";
export type Filter = "online" | "all" | "pending";

export type Friend = Readonly<{
  id: string;
  userName: string;
  status: Status;
  initials: string;
  tone: string;
}>;

export type Group = Readonly<{
  id: string;
  name: string;
  members: number;
}>;

export type Message = Readonly<{
  id: string;
  own: boolean;
  text: string;
}>;

export type MobileNavigationProps = Readonly<{
  onOpenMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  menuOpen: boolean;
}>;
