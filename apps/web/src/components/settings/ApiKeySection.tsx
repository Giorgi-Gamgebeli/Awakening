import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  ApiKeysCreateInputSchema,
  ApiKeysFindManyOutputSchema,
  ApiKeysProviderSchema,
  ApiKeysReasoningEffortSchema,
  agentModelsOutputSchema,
  z,
} from "@repo/zod";
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

const ApiKeysCreateFormSchema = ApiKeysCreateInputSchema.extend({
  selectedModel: z.string(),
});

function useAgentModels(apiKeyId: number) {
  const modelsQuery = useQuery(
    orpc.agent.models.queryOptions({ input: { apiKeyId } }),
  );

  return { models: modelsQuery.data ?? [], isLoading: modelsQuery.isLoading };
}

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
      reasoningEffort?: z.infer<typeof ApiKeysReasoningEffortSchema>;
    },
  ) => Promise<void>;
  patchingId?: number | null;
}>;

function AgentModelPicker({
  apiKeyId,
  value,
  disabled,
  isEditing,
  onChange,
}: Readonly<{
  apiKeyId: number;
  value?: string;
  disabled?: boolean;
  isEditing: boolean;
  onChange: (modelId: string) => void;
}>) {
  const { models, isLoading } = useAgentModels(apiKeyId);
  const hasModels = models.length > 0;
  const persistedFallbackRef = useRef<string | null>(null);
  const fallbackModelId = models[0]?.id;

  useEffect(() => {
    if (
      !isEditing ||
      value ||
      !fallbackModelId ||
      persistedFallbackRef.current
    ) {
      return;
    }

    persistedFallbackRef.current = fallbackModelId;
    onChange(fallbackModelId);
  }, [fallbackModelId, isEditing, onChange, value]);

  return (
    <div className="w-full min-w-0">
      <Select
        value={value ?? fallbackModelId}
        onValueChange={onChange}
        disabled={disabled || isLoading || !hasModels}
      >
        <SelectTrigger
          aria-label={`Model for API key #${apiKeyId}`}
          className="min-h-10 w-full"
        >
          <SelectValue
            placeholder={isLoading ? "Loading models…" : "No compatible model"}
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
      reasoningEffort?: z.infer<typeof ApiKeysReasoningEffortSchema>;
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
          {entry.label}
        </span>
        <span className="max-w-40 shrink-0 truncate rounded-lg bg-surface-raised px-2.5 py-1.5 font-mono text-xs text-content-muted">
          {entry.provider}
        </span>
        {entry.selectedModel ? (
          <span className="max-w-56 truncate rounded-lg bg-surface-raised px-2.5 py-1.5 font-mono text-xs text-content-muted">
            {entry.selectedModel}
          </span>
        ) : null}
        {entry.reasoningEffort ? (
          <span
            title="Reasoning effort"
            className="max-w-32 shrink-0 truncate rounded-lg bg-system/14 px-2.5 py-1.5 font-mono text-xs font-bold text-system"
          >
            {entry.reasoningEffort}
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
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-content-muted">
              API key
              <span className="relative block">
                <input
                  type="password"
                  value="••••••••••••"
                  disabled
                  aria-label="API key cannot be changed"
                  className="h-10 w-full cursor-not-allowed rounded-xl border border-border bg-surface-raised py-2 pr-48 pl-3 font-mono text-sm font-normal text-content disabled:opacity-45"
                />
                <span
                  title="To change the API key, delete this key and add a new one."
                  className="pointer-events-none absolute inset-y-0 right-3 flex max-w-[55%] items-center truncate text-xs font-semibold text-content-subtle"
                >
                  Edit unavailable for safety
                </span>
              </span>
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Model
              </span>
              <AgentModelPicker
                apiKeyId={entry.id}
                value={entry.selectedModel ?? undefined}
                disabled={isPatching}
                isEditing={isEditing}
                onChange={(model) =>
                  void onUpdate(entry.id, { selectedModel: model })
                }
              />
            </div>
            <div className="flex min-w-40 flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Reasoning effort
              </span>
              <Select
                value={entry.reasoningEffort}
                disabled={isPatching}
                onValueChange={(value) =>
                  void onUpdate(entry.id, {
                    reasoningEffort: value as z.infer<
                      typeof ApiKeysReasoningEffortSchema
                    >,
                  })
                }
              >
                <SelectTrigger
                  aria-label="Reasoning effort"
                  className="h-10 min-h-10"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
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
  const [isAdding, setIsAdding] = useState(false);
  const [availableModels, setAvailableModels] = useState<z.infer<
    typeof agentModelsOutputSchema
  > | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const {
    handleSubmit,
    register,
    reset,
    control,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof ApiKeysCreateFormSchema>>({
    resolver: zodResolver(ApiKeysCreateFormSchema),
    defaultValues: {
      provider: "GEMINI",
      label: "",
      key: "",
      selectedModel: "",
      reasoningEffort: "default",
    },
  });
  const selectedProvider = watch("provider");
  const apiKey = watch("key");
  const newKeyLabel = watch("label");
  const newKeyModel = watch("selectedModel");
  const newKeyReasoningEffort = watch("reasoningEffort");
  const { mutateAsync: checkAvailability, isPending: isCheckingAvailability } =
    useMutation(orpc.apiKeys.checkAvailability.mutationOptions());
  const modelPlaceholder = availableModels
    ? "Choose model"
    : "Provide API key first";
  const availabilityRequestId = useRef(0);

  useEffect(() => {
    const requestId = ++availabilityRequestId.current;
    setAvailableModels(null);
    setAvailabilityError(null);
    setValue("selectedModel", "");
    clearErrors("selectedModel");

    if (!isAdding || !apiKey.trim()) return;

    const timeoutId = window.setTimeout(() => {
      void checkAvailability({ provider: selectedProvider, key: apiKey })
        .then((models) => {
          if (requestId !== availabilityRequestId.current) return;

          if (models.length === 0) {
            setAvailabilityError("This API key has no available models.");
            return;
          }

          setAvailableModels(models);
        })
        .catch((error) => {
          if (requestId === availabilityRequestId.current) {
            setAvailabilityError(
              error instanceof Error &&
                error.message === "This API key has already been added."
                ? error.message
                : "Could not verify this API key.",
            );
          }
        });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    apiKey,
    checkAvailability,
    clearErrors,
    isAdding,
    selectedProvider,
    setValue,
  ]);

  async function handleAdd(input: z.infer<typeof ApiKeysCreateFormSchema>) {
    setSaveError(null);

    if (!availableModels) {
      return;
    }

    const parsedInput = ApiKeysCreateInputSchema.safeParse(input);
    if (!parsedInput.success) {
      const selectedModelError = parsedInput.error.issues.find(
        (issue) => issue.path[0] === "selectedModel",
      );

      if (selectedModelError) {
        setError("selectedModel", { message: selectedModelError.message });
      }
      return;
    }

    try {
      await onSave(parsedInput.data);
      reset({
        provider: "GEMINI",
        label: "",
        key: "",
        selectedModel: "",
        reasoningEffort: "default",
      });
      setIsAdding(false);
    } catch (error) {
      setSaveError(
        error instanceof Error &&
          error.message === "This API key has already been added."
          ? error.message
          : "Could not save this key. Please try again.",
      );
    }
  }

  function cancelAdd() {
    reset({
      provider: "GEMINI",
      label: "",
      key: "",
      selectedModel: "",
      reasoningEffort: "default",
    });
    setSaveError(null);
    setIsAdding(false);
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id={`${listLabel}-title`}
            className="font-display text-lg font-extrabold tracking-tight text-content"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-content-muted">
            {description}
          </p>
        </div>
        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            disabled={isSubmitting}
            className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-system px-4 text-xs font-bold text-on-system transition-colors hover:bg-system-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
          >
            <Plus size={15} aria-hidden="true" />
            Add key
          </button>
        ) : null}
      </div>

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
          No keys yet. Add your first key.
        </p>
      )}
      {isAdding ? (
        <div className="mt-4 flex flex-col rounded-xl border border-border-subtle bg-canvas/45 px-3 py-2">
          <div
            aria-label="New API key preview"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-system/14 font-mono text-xs font-bold text-system">
              {items.length + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-content">
              {newKeyLabel}
            </span>
            <span className="max-w-40 shrink-0 truncate rounded-lg bg-surface-raised px-2.5 py-1.5 font-mono text-xs text-content-muted">
              {selectedProvider}
            </span>
            {newKeyModel ? (
              <span className="max-w-56 truncate rounded-lg bg-surface-raised px-2.5 py-1.5 font-mono text-xs text-content-muted">
                {newKeyModel}
              </span>
            ) : null}
            <span
              title="Reasoning effort"
              className="max-w-32 shrink-0 truncate rounded-lg bg-system/14 px-2.5 py-1.5 font-mono text-xs font-bold text-system"
            >
              {newKeyReasoningEffort}
            </span>
          </div>
          <form
            onSubmit={handleSubmit(handleAdd)}
            className="mt-3 flex flex-col gap-3 border-t border-border-subtle pt-3"
          >
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-content-muted">
              Label
              <input
                {...register("label")}
                placeholder="Label (optional)"
                maxLength={50}
                disabled={isSubmitting}
                className={`h-10 rounded-xl border border-border bg-surface-raised px-3 text-sm font-normal text-content placeholder:text-content-subtle disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
              />
            </label>
            {errors.label ? (
              <p className="text-sm text-red-300">{errors.label.message}</p>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Provider
              </span>
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
            </div>
            {errors.provider ? (
              <p className="text-sm text-red-300">{errors.provider.message}</p>
            ) : null}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-content-muted">
              API key
              <span className="relative block">
                <input
                  id={`${listLabel}-key`}
                  type="password"
                  {...register("key")}
                  placeholder={keyPlaceholder}
                  autoComplete="off"
                  disabled={isSubmitting}
                  className={`h-10 min-w-0 w-full rounded-xl border border-border bg-surface-raised py-2 pr-40 pl-3 font-mono text-sm font-normal text-content placeholder:font-body placeholder:text-content-subtle disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
                />
                {isCheckingAvailability ? (
                  <span
                    aria-live="polite"
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-content-muted"
                  >
                    Checking…
                  </span>
                ) : availabilityError ? (
                  <span
                    role="alert"
                    title={availabilityError}
                    className="pointer-events-none absolute inset-y-0 right-3 flex max-w-[45%] items-center truncate text-xs font-semibold text-red-300"
                  >
                    {availabilityError}
                  </span>
                ) : availableModels ? (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-emerald-400">
                    Available
                  </span>
                ) : null}
              </span>
            </label>
            {errors.key ? (
              <p className="text-sm text-red-300">{errors.key.message}</p>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Model
              </span>
              <Controller
                control={control}
                name="selectedModel"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || !availableModels}
                  >
                    <SelectTrigger
                      aria-label="Model"
                      className={`h-10 min-h-10 ${
                        availableModels ? "" : "cursor-not-allowed opacity-45"
                      }`}
                    >
                      <SelectValue placeholder={modelPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {(availableModels ?? []).map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {errors.selectedModel ? (
              <p className="text-sm text-red-300">
                {errors.selectedModel.message}
              </p>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-content-muted">
                Reasoning effort
              </span>
              <Controller
                control={control}
                name="reasoningEffort"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || !availableModels}
                  >
                    <SelectTrigger
                      aria-label="Reasoning effort"
                      className={`h-10 min-h-10 ${
                        availableModels ? "" : "cursor-not-allowed opacity-45"
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {errors.reasoningEffort ? (
              <p className="text-sm text-red-300">
                {errors.reasoningEffort.message}
              </p>
            ) : null}
            {saveError ? (
              <p role="alert" className="text-sm text-red-300">
                {saveError}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`h-10 rounded-xl bg-system px-3 text-xs font-bold text-on-system disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
              >
                {isSubmitting ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={cancelAdd}
                disabled={isSubmitting}
                className={`h-10 rounded-xl px-3 text-xs font-bold text-content-muted hover:text-content disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {deleteError ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {deleteError}
        </p>
      ) : null}
    </section>
  );
}
