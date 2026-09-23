import { Avatar } from "./Avatar";
import type { Friend, Message } from "./types";

type MessageBubbleProps = Readonly<{
  message: Message;
  friend: Friend;
}>;

export function MessageBubble({ message, friend }: MessageBubbleProps) {
  const messageFriend = message.own
    ? {
        ...friend,
        userName: "You",
        initials: "R",
        tone: "bg-accent/18 text-accent-bright",
      }
    : friend;

  return (
    <div className={`flex gap-3 ${message.own ? "flex-row-reverse" : ""}`}>
      <Avatar friend={messageFriend} />
      <div
        className={`max-w-[min(78%,36rem)] ${message.own ? "text-right" : ""}`}
      >
        <p className="px-1 text-xs font-semibold text-white">
          {message.own ? "You" : friend.userName}
        </p>
        <p
          className={`mt-1 wrap-break-word rounded-2xl border px-3.5 py-2.5 text-sm leading-6 ${
            message.own
              ? "border-accent/38 bg-accent/14 text-content"
              : "home-message-surface border-border-strong text-content"
          }`}
        >
          {message.text}
        </p>
      </div>
    </div>
  );
}
