import type { Friend } from "./types";

type AvatarProps = Readonly<{
  friend: Friend;
  size?: string;
}>;

export function Avatar({ friend, size = "size-10" }: AvatarProps) {
  const indicator =
    friend.status === "ONLINE"
      ? "bg-green-400"
      : friend.status === "IDLE"
        ? "bg-amber-400"
        : "bg-content-subtle";

  return (
    <div
      className={`relative grid shrink-0 place-items-center rounded-xl ${size} ${friend.tone} font-mono text-xs font-bold`}
      aria-hidden="true"
    >
      <span aria-hidden="true">{friend.initials}</span>
      <span
        className={`absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface ${indicator}`}
        aria-hidden="true"
      />
    </div>
  );
}
