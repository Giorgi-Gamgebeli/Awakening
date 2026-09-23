import { useState } from "react";
import { Ellipsis, Phone, Video } from "lucide-react";
import { UtilityHeader } from "./UtilityHeader";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { focusRing } from "./constants";
import type { Friend, Message, MobileNavigationProps } from "./types";

type ChatViewProps = MobileNavigationProps & Readonly<{ friend: Friend }>;

export function ChatView({ friend, ...mobileNavigation }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      own: false,
      text: `This is the beginning of your direct channel with ${friend.userName}.`,
    },
  ]);

  function handleSend(text: string) {
    setMessages((items) => [
      ...items,
      { id: crypto.randomUUID(), own: true, text },
    ]);
  }

  return (
    <>
      <UtilityHeader
        title={friend.userName}
        subtitle="Direct message"
        {...mobileNavigation}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`grid size-11 place-items-center rounded-xl text-content-subtle transition-colors hover:bg-surface-raised hover:text-system ${focusRing}`}
            aria-label="Voice call"
          >
            <Phone size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`grid size-11 place-items-center rounded-xl text-content-subtle transition-colors hover:bg-surface-raised hover:text-system ${focusRing}`}
            aria-label="Video call"
          >
            <Video size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`grid size-11 place-items-center rounded-xl text-content-subtle transition-colors hover:bg-surface-raised hover:text-content ${focusRing}`}
            aria-label="More options"
          >
            <Ellipsis size={19} aria-hidden="true" />
          </button>
        </div>
      </UtilityHeader>

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-7"
          aria-live="polite"
        >
          <div className="flex-1" />
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} friend={friend} />
          ))}
        </div>

        <Composer friend={friend} onSend={handleSend} />
      </div>
    </>
  );
}
