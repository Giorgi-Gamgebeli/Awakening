import { useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { focusRing } from "../home/constants";
import { createApiKey, maskKey, type ApiKeyEntry } from "../../lib/apiKeys";

type ApiKeySectionProps = Readonly<{
  title: string;
  description: string;
  items: ApiKeyEntry[];
  onChange: (items: ApiKeyEntry[]) => void;
  providerPlaceholder: string;
  keyPlaceholder: string;
  listLabel: string;
}>;

function KeyRow({
  entry,
  index,
  onRemove,
}: Readonly<{
  entry: ApiKeyEntry;
  index: number;
  onRemove: () => void;
}>) {
  const [revealed, setRevealed] = useState(false);

  return (
    <li className="flex items-center gap-2 rounded-xl border border-border-subtle bg-canvas/45 px-3 py-2.5">
      <span
        className={`key-drag-handle grid size-9 shrink-0 cursor-grab place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-raised hover:text-content active:cursor-grabbing ${focusRing}`}
        aria-label={`Reorder ${entry.provider}, priority ${index + 1}`}
      >
        <GripVertical size={17} aria-hidden="true" />
      </span>
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-system/14 font-mono text-xs font-bold text-system">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-content">
          {entry.provider}
        </span>
        <span className="block truncate font-mono text-xs text-content-subtle">
          {revealed ? entry.key : maskKey(entry.key)}
        </span>
      </span>
      <button
        type="button"
        onClick={() => setRevealed((value) => !value)}
        className={`grid size-9 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-raised hover:text-content ${focusRing}`}
        aria-label={revealed ? `Hide key for ${entry.provider}` : `Reveal key for ${entry.provider}`}
        aria-pressed={revealed}
      >
        {revealed ? (
          <EyeOff size={16} aria-hidden="true" />
        ) : (
          <Eye size={16} aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className={`grid size-9 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-raised hover:text-red-300 ${focusRing}`}
        aria-label={`Remove ${entry.provider} key`}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </li>
  );
}

export function ApiKeySection({
  title,
  description,
  items,
  onChange,
  providerPlaceholder,
  keyPlaceholder,
  listLabel,
}: ApiKeySectionProps) {
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!provider.trim() || !apiKey) return;
    onChange([...items, createApiKey(provider, apiKey)]);
    setProvider("");
    setApiKey("");
  }

  return (
    <section
      aria-labelledby={`${listLabel}-title`}
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <h2
        id={`${listLabel}-title`}
        className="font-display text-lg font-extrabold tracking-tight text-content"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-content-muted">{description}</p>

      <form onSubmit={handleAdd} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <label className="sr-only" htmlFor={`${listLabel}-provider`}>
          Provider label
        </label>
        <input
          id={`${listLabel}-provider`}
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          placeholder={providerPlaceholder}
          autoComplete="off"
          className={`min-h-11 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-content placeholder:text-content-subtle ${focusRing}`}
        />
        <label className="sr-only" htmlFor={`${listLabel}-key`}>
          API key
        </label>
        <input
          id={`${listLabel}-key`}
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={keyPlaceholder}
          autoComplete="off"
          className={`min-h-11 rounded-xl border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-content placeholder:font-body placeholder:text-content-subtle ${focusRing}`}
        />
        <button
          type="submit"
          disabled={!provider.trim() || !apiKey}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-system px-4 py-2 text-xs font-bold text-on-system transition-colors hover:bg-system-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
        >
          <Plus size={15} aria-hidden="true" />
          Add key
        </button>
      </form>

      {items.length ? (
        <ReactSortable
          tag="ul"
          list={items}
          setList={onChange}
          animation={200}
          handle=".key-drag-handle"
          className="mt-4 grid gap-2"
        >
          {items.map((entry, index) => (
            <KeyRow
              key={entry.id}
              entry={entry}
              index={index}
              onRemove={() =>
                onChange(items.filter((item) => item.id !== entry.id))
              }
            />
          ))}
        </ReactSortable>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-content-subtle">
          No keys yet. Add your first key above.
        </p>
      )}
      {items.length ? (
        <p className="mt-3 text-xs leading-5 text-content-subtle">
          Priority 1 is tried first, then 2, 3… Drag the handle to reorder.
        </p>
      ) : null}
    </section>
  );
}
