import { Paperclip, Send } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { focusRing } from "./constants";
import type { Friend } from "./types";

type ComposerProps = Readonly<{
  friend: Friend;
  onSend: (text: string) => void;
}>;

export function Composer({ friend, onSend }: ComposerProps) {
  const [input, setInput] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  }

  return (
    <div className="home-composer border-border-subtle px-4 pt-4 sm:px-7">
      <form
        onSubmit={handleSubmit}
        className="home-control-surface flex items-center gap-2 rounded-2xl border border-border-strong p-2 transition-colors focus-within:border-system sm:gap-3"
      >
        <button
          type="button"
          className={`grid size-11 shrink-0 place-items-center rounded-xl text-content-subtle transition-colors hover:bg-surface-raised hover:text-system ${focusRing}`}
          aria-label="Attach file"
        >
          <Paperclip size={18} aria-hidden="true" />
        </button>
        <label className="sr-only" htmlFor="message-input">
          Message {friend.userName}
        </label>
        <input
          id="message-input"
          name="message"
          autoComplete="off"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`Message ${friend.userName}…`}
          className="min-w-0 flex-1 bg-transparent px-1 text-base text-content outline-none placeholder:text-content-subtle sm:text-sm"
        />
        <button
          type="submit"
          className={`grid size-11 shrink-0 place-items-center rounded-xl bg-system text-on-system transition-colors hover:bg-system-hover active:scale-[0.98] ${focusRing}`}
          aria-label="Send message"
        >
          <Send size={17} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
