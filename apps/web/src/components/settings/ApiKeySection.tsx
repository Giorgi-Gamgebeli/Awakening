import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ApiKeysCreateInputSchema,
  ApiKeysFindManyOutputSchema,
  ApiKeysPurposeSchema,
} from "@repo/zod";
import type { z } from "@repo/zod";
import { focusRing } from "../home/constants";

type ApiKeySectionProps = Readonly<{
  title: string;
  description: string;
  purpose: z.infer<typeof ApiKeysPurposeSchema>;
  items: z.infer<typeof ApiKeysFindManyOutputSchema>;
  onSave: (input: z.infer<typeof ApiKeysCreateInputSchema>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  keyPlaceholder: string;
  listLabel: string;
}>;

function KeyRow({
  entry,
  index,
  isDeleting,
  onDelete,
}: Readonly<{
  entry: z.infer<typeof ApiKeysFindManyOutputSchema>[number];
  index: number;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
}>) {
  return (
    <li className="flex items-center gap-2 rounded-xl border border-border-subtle bg-canvas/45 px-3 py-2.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-system/14 font-mono text-xs font-bold text-system">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-content">
          {entry.provider}
        </span>
        <span className="block truncate font-mono text-xs text-content-subtle">
          Saved securely on the server
        </span>
      </span>
      <button
        type="button"
        onClick={() => void onDelete()}
        disabled={isDeleting}
        className={`grid size-9 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
        aria-label={`Delete ${entry.provider} API key`}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </li>
  );
}

export function ApiKeySection({
  title,
  description,
  purpose,
  items,
  onSave,
  onDelete,
  keyPlaceholder,
  listLabel,
}: ApiKeySectionProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof ApiKeysCreateInputSchema>>({
    resolver: zodResolver(ApiKeysCreateInputSchema),
    defaultValues: { provider: "GEMINI", key: "", purpose },
  });

  async function handleAdd(input: z.infer<typeof ApiKeysCreateInputSchema>) {
    setSaveError(null);

    try {
      await onSave(input);
      reset({ provider: "GEMINI", key: "", purpose });
    } catch {
      setSaveError("Could not save this key. Please try again.");
    }
  }

  async function handleDelete(id: number) {
    setDeleteError(null);
    setDeletingId(id);

    try {
      await onDelete(id);
    } catch {
      setDeleteError("Could not delete this key. Please try again.");
    } finally {
      setDeletingId(null);
    }
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

      <form
        onSubmit={handleSubmit(handleAdd)}
        className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
      >
        <label className="sr-only" htmlFor={`${listLabel}-provider`}>
          Provider
        </label>
        <select
          id={`${listLabel}-provider`}
          {...register("provider")}
          className={`min-h-11 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-content placeholder:text-content-subtle ${focusRing}`}
        >
          <option value="GEMINI">Gemini</option>
          <option value="OPENAI">OpenAI</option>
          <option value="ANTHROPIC">Claude</option>
        </select>
        {errors.provider ? (
          <p className="text-sm text-red-300 sm:col-span-3">
            {errors.provider.message}
          </p>
        ) : null}
        <label className="sr-only" htmlFor={`${listLabel}-key`}>
          API key
        </label>
        <input
          id={`${listLabel}-key`}
          type="password"
          {...register("key")}
          placeholder={keyPlaceholder}
          autoComplete="off"
          className={`min-h-11 rounded-xl border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-content placeholder:font-body placeholder:text-content-subtle ${focusRing}`}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-system px-4 py-2 text-xs font-bold text-on-system transition-colors hover:bg-system-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
        >
          <Plus size={15} aria-hidden="true" />
          {isSubmitting ? "Saving…" : "Add key"}
        </button>
        {errors.key ? (
          <p className="text-sm text-red-300 sm:col-span-3">
            {errors.key.message}
          </p>
        ) : null}
      </form>

      {saveError ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {saveError}
        </p>
      ) : null}

      {items.length ? (
        <ul className="mt-4 grid gap-2">
          {items.map((entry, index) => (
            <KeyRow
              key={entry.id}
              entry={entry}
              index={index}
              isDeleting={deletingId === entry.id}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-content-subtle">
          No keys yet. Add your first key above.
        </p>
      )}
      {items.length ? (
        <p className="mt-3 text-xs leading-5 text-content-subtle">
          Saved keys cannot be revealed in the browser.
        </p>
      ) : null}
      {deleteError ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {deleteError}
        </p>
      ) : null}
    </section>
  );
}
