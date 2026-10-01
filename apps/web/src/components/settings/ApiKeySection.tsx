import { useState } from "react";
import { Plus } from "lucide-react";
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
  providerPlaceholder: string;
  keyPlaceholder: string;
  listLabel: string;
}>;

function KeyRow(
  {
    entry,
    index,
  }: Readonly<{
    entry: z.infer<typeof ApiKeysFindManyOutputSchema>[number];
    index: number;
  }>,
) {
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
    </li>
  );
}

export function ApiKeySection({
  title,
  description,
  purpose,
  items,
  onSave,
  providerPlaceholder,
  keyPlaceholder,
  listLabel,
}: ApiKeySectionProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof ApiKeysCreateInputSchema>>({
    resolver: zodResolver(ApiKeysCreateInputSchema),
    defaultValues: { provider: "", key: "", purpose },
  });

  async function handleAdd(input: z.infer<typeof ApiKeysCreateInputSchema>) {
    setSaveError(null);

    try {
      await onSave(input);
      reset({ provider: "", key: "", purpose });
    } catch {
      setSaveError("Could not save this key. Please try again.");
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
          Provider label
        </label>
        <input
          id={`${listLabel}-provider`}
          {...register("provider")}
          placeholder={providerPlaceholder}
          autoComplete="off"
          className={`min-h-11 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-content placeholder:text-content-subtle ${focusRing}`}
        />
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
            <KeyRow key={entry.id} entry={entry} index={index} />
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
    </section>
  );
}
