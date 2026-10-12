import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  ApiKeysCreateInputSchema,
  ApiKeysFindManyOutputSchema,
  ApiKeysProviderSchema,
} from "@repo/zod";
import type { z } from "@repo/zod";
import { orpc } from "../../lib/orpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { focusRing } from "../home/constants";

type ApiKeyEntry = z.infer<typeof ApiKeysFindManyOutputSchema>[number];

type ApiKeySectionProps = Readonly<{
  title: string;
  description: string;
  items: z.infer<typeof ApiKeysFindManyOutputSchema>;
  onSave: (input: z.infer<typeof ApiKeysCreateInputSchema>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  keyPlaceholder: string;
  listLabel: string;
  onSelectActive?: (id: number) => Promise<void>;
  onUpdate?: (
    id: number,
    data: {
      label?: string | null;
      provider?: z.infer<typeof ApiKeysProviderSchema>;
      selectedModel?: string;
    },
  ) => Promise<void>;
  patchingId?: number | null;
}>;

function AgentModelPicker({
  apiKeyId,
  value,
  disabled,
  onChange,
}: Readonly<{
  apiKeyId: number;
  value?: string;
  disabled?: boolean;
  onChange: (modelId: string) => void;
}>) {
  const modelsQuery = useQuery(
    orpc.agent.models.queryOptions({ input: { apiKeyId } }),
  );
  const models = modelsQuery.data ?? [];
  const hasModels = models.length > 0;

  return (
    <div className="w-full min-w-0">
      <Select
        value={value ?? models[0]?.id}
        onValueChange={onChange}
        disabled={disabled || modelsQuery.isLoading || !hasModels}
      >
        <SelectTrigger
          aria-label={`Model for API key #${apiKeyId}`}
          className="min-h-10 w-full"
        >
          <SelectValue
            placeholder={
              modelsQuery.isLoading ? "Loading models…" : "No compatible model"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function KeyRow({
  entry,
  index,
  listLabel,
  isDeleting,
  isPatching,
  onDelete,
  onSelectActive,
  onUpdate,
}: Readonly<{
  entry: ApiKeyEntry;
  index: number;
  listLabel: string;
  isDeleting: boolean;
  isPatching: boolean;
  onDelete: () => Promise<void>;
  onSelectActive?: (id: number) => Promise<void>;
  onUpdate?: (
    id: number,
    data: {
      label?: string | null;
      provider?: z.infer<typeof ApiKeysProviderSchema>;
      selectedModel?: string;
    },
  ) => Promise<void>;
}>) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [label, setLabel] = useState(entry.label ?? "");

  useEffect(() => {
    setLabel(entry.label ?? "");
  }, [entry.label]);

  async function saveLabel() {
    if (!onUpdate) return;

    await onUpdate(entry.id, { label: label.trim() || null });
    setIsEditing(false);
  }

  async function confirmDelete() {
    try {
      await onDelete();
      setDeleteDialogOpen(false);
    } catch {
      // The section displays the failure message and keeps this dialog open.
    }
  }

  return (
    <li className="flex flex-col rounded-xl border border-border-subtle bg-canvas/45 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-system/14 font-mono text-xs font-bold text-system">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-content">
          {entry.label || entry.provider}
        </span>
        {entry.label ? (
          <span className="max-w-40 shrink-0 truncate rounded-lg bg-surface-raised px-2.5 py-1.5 font-mono text-xs text-content-muted">
            {entry.provider}
          </span>
        ) : null}
        {entry.selectedModel ? (
          <span className="max-w-56 truncate rounded-lg bg-surface-raised px-2.5 py-1.5 font-mono text-xs text-content-muted">
            {entry.selectedModel}
          </span>
        ) : null}
        {onSelectActive ? (
          <label
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${focusRing} ${
              entry.isActive
                ? "text-system"
                : "text-content-subtle hover:text-content"
            }`}
          >
            <input
              type="radio"
              name={`${listLabel}-active-key`}
              checked={entry.isActive}
              disabled={isPatching}
              onChange={() => void onSelectActive(entry.id)}
              className="size-4 accent-[var(--color-system)]"
              aria-label={`Use ${entry.provider} key #${entry.id} for AI`}
            />
            {entry.isActive ? "In use" : "Use"}
          </label>
        ) : null}
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              disabled={isDeleting || isPatching}
              className={`grid size-9 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-raised hover:text-content disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
              aria-label={`Actions for ${entry.label || entry.provider} API key`}
            >
              <MoreHorizontal size={18} aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-32 rounded-xl border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md"
            >
              <DropdownMenu.Item
                onSelect={() => setIsEditing(true)}
                className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 outline-none focus:bg-system/15"
              >
                <Pencil size={15} aria-hidden="true" />
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => setDeleteDialogOpen(true)}
                className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-red-400 outline-none data-[highlighted]:bg-red-400/15 data-[highlighted]:text-red-400"
              >
                <Trash2 size={15} aria-hidden="true" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-5 rounded-2xl border border-border bg-surface p-5 text-content shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <Dialog.Title className="font-display text-lg font-extrabold tracking-tight">
              Delete API key?
            </Dialog.Title>
            <Dialog.Description className="text-sm leading-6 text-content-muted">
              Delete {entry.label || entry.provider}? This cannot be undone.
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isDeleting}
                  className={`h-10 rounded-xl px-3 text-sm font-semibold text-content-muted hover:text-content disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
                className={`h-10 rounded-xl bg-red-400 px-3 text-sm font-bold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
              >
                {isDeleting ? "Deleting…" : "Delete key"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {onUpdate ? (
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isEditing
              ? "h-[calc-size(auto,size)] opacity-100 pt-3"
              : "h-0 opacity-0 pt-0"
          }`}
        >
          <div
            className={`flex flex-col gap-3 border-t pt-3 ${
              isEditing ? "border-border-subtle" : "border-transparent"
            }`}
          >
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-content-muted">
              Label
              <input
                value={label}
                maxLength={50}
                onChange={(event) => setLabel(event.target.value)}
                disabled={isPatching}
                placeholder={entry.provider}
                className={`h-10 rounded-xl border border-border bg-surface-raised px-3 text-sm font-normal text-content placeholder:text-content-subtle disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Provider
              </span>
              <Select
                value={entry.provider}
                disabled={isPatching}
                onValueChange={(provider) =>
                  void onUpdate(entry.id, {
                    provider: provider as z.infer<typeof ApiKeysProviderSchema>,
                  })
                }
              >
                <SelectTrigger aria-label="Provider" className="h-10 min-h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GEMINI">Gemini</SelectItem>
                  <SelectItem value="OPENAI">OpenAI</SelectItem>
                  <SelectItem value="ANTHROPIC">Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Model
              </span>
              <AgentModelPicker
                apiKeyId={entry.id}
                value={entry.selectedModel ?? undefined}
                disabled={isPatching}
                onChange={(model) =>
                  void onUpdate(entry.id, { selectedModel: model })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void saveLabel()}
                disabled={isPatching}
                className={`h-10 rounded-xl bg-system px-3 text-xs font-bold text-on-system disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setLabel(entry.label ?? "");
                  setIsEditing(false);
                }}
                disabled={isPatching}
                className={`h-10 rounded-xl px-3 text-xs font-bold text-content-muted hover:text-content disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function ApiKeySection({
  title,
  description,
  items,
  onSave,
  onDelete,
  keyPlaceholder,
  listLabel,
  onSelectActive,
  onUpdate,
  patchingId,
}: ApiKeySectionProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof ApiKeysCreateInputSchema>>({
    resolver: zodResolver(ApiKeysCreateInputSchema),
    defaultValues: { provider: "GEMINI", label: "", key: "" },
  });

  async function handleAdd(input: z.infer<typeof ApiKeysCreateInputSchema>) {
    setSaveError(null);

    try {
      await onSave(input);
      reset({ provider: "GEMINI", label: "", key: "" });
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
      throw new Error("Could not delete API key.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section aria-labelledby={`${listLabel}-title`} className="w-full">
      <h2
        id={`${listLabel}-title`}
        className="font-display text-lg font-extrabold tracking-tight text-content"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-content-muted">{description}</p>

      <form
        onSubmit={handleSubmit(handleAdd)}
        className="mt-4 grid gap-2 sm:grid-cols-[12rem_12rem_minmax(0,1fr)_auto]"
      >
        <Controller
          control={control}
          name="provider"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id={`${listLabel}-provider`}
                aria-label="Provider"
                className={`h-10 min-h-10 w-full ${focusRing}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="min-h-10 px-3" value="GEMINI">
                  Gemini
                </SelectItem>
                <SelectItem className="min-h-10 px-3" value="OPENAI">
                  OpenAI
                </SelectItem>
                <SelectItem className="min-h-10 px-3" value="ANTHROPIC">
                  Claude
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <input
          aria-label="Label"
          {...register("label")}
          placeholder="Label (optional)"
          maxLength={50}
          className={`h-10 rounded-xl border border-border bg-surface-raised px-3 text-sm text-content placeholder:text-content-subtle ${focusRing}`}
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
          className={`h-10 rounded-xl border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-content placeholder:font-body placeholder:text-content-subtle ${focusRing}`}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-system px-4 py-2 text-xs font-bold text-on-system transition-colors hover:bg-system-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
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
              listLabel={listLabel}
              isDeleting={deletingId === entry.id}
              isPatching={patchingId === entry.id}
              onDelete={() => handleDelete(entry.id)}
              onSelectActive={onSelectActive}
              onUpdate={onUpdate}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-content-subtle">
          No keys yet. Add your first key above.
        </p>
      )}
      {deleteError ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {deleteError}
        </p>
      ) : null}
    </section>
  );
}
