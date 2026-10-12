import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiKeysCreateInputSchema, ApiKeysProviderSchema } from "@repo/zod";
import type { z } from "@repo/zod";
import { ConversationPanel, UtilityHeader } from "../components/home";
import { ApiKeySection } from "../components/settings/ApiKeySection";
import { orpc } from "../lib/orpc";
import "./HomePage.css";

export function SettingsPage() {
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [patchingId, setPatchingId] = useState<number | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const apiKeysQuery = useQuery(orpc.apiKeys.findMany.queryOptions());
  const createApiKeyMutation = useMutation({
    ...orpc.apiKeys.create.mutationOptions(),
    onSuccess(createdKey) {
      queryClient.setQueryData(
        orpc.apiKeys.findMany.queryKey(),
        (current = []) => [...current, createdKey],
      );
    },
  });
  const deleteApiKeyMutation = useMutation({
    ...orpc.apiKeys.delete.mutationOptions(),
    onSuccess(deletedKey) {
      queryClient.setQueryData(
        orpc.apiKeys.findMany.queryKey(),
        (current = []) =>
          current.filter((apiKey) => apiKey.id !== deletedKey.id),
      );
    },
  });
  const patchApiKeyMutation = useMutation(orpc.apiKeys.patch.mutationOptions());

  useEffect(() => {
    document.title = "Settings | Awakening";
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const previousColorScheme = root.style.colorScheme;
    const previousThemeColor = themeColor?.content;

    root.style.colorScheme = "dark";
    if (themeColor) themeColor.content = "#121522";

    return () => {
      root.style.colorScheme = previousColorScheme;
      if (themeColor && previousThemeColor) {
        themeColor.content = previousThemeColor;
      }
    };
  }, []);

  async function createApiKey(input: z.infer<typeof ApiKeysCreateInputSchema>) {
    await createApiKeyMutation.mutateAsync(input);
  }

  async function deleteApiKey(id: number) {
    await deleteApiKeyMutation.mutateAsync({ id });
  }

  const apiKeys = apiKeysQuery.data ?? [];
  async function patchApiKey(
    id: number,
    data: {
      label?: string | null;
      provider?: z.infer<typeof ApiKeysProviderSchema>;
      selectedModel?: string;
      isActive?: boolean;
    },
  ) {
    setPatchError(null);
    setPatchingId(id);
    try {
      const updated = await patchApiKeyMutation.mutateAsync({ id, ...data });
      queryClient.setQueryData(
        orpc.apiKeys.findMany.queryKey(),
        (current = []) =>
          current.map((apiKey) =>
            apiKey.id === updated.id
              ? updated
              : updated.isActive &&
                  apiKey.isActive
                ? { ...apiKey, isActive: false }
                : apiKey,
          ),
      );
    } catch {
      setPatchError("Could not save this change. Please try again.");
    } finally {
      setPatchingId(null);
    }
  }

  async function selectActiveKey(id: number) {
    await patchApiKey(id, { isActive: true });
  }

  function closeMobilePanel() {
    setMobilePanelOpen(false);
    requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
  }

  const mobileNavigation = {
    onOpenMenu: () => setMobilePanelOpen(true),
    menuButtonRef: mobileMenuButtonRef,
    menuOpen: mobilePanelOpen,
  };

  return (
    <div className="home-shell flex min-h-[100dvh] font-body text-content antialiased">
      <a
        href="#settings-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-system focus:px-3 focus:py-2 focus:text-on-system"
      >
        Skip to content
      </a>
      <div className="flex min-w-0 flex-1">
        <ConversationPanel
          mobileOpen={mobilePanelOpen}
          onClose={closeMobilePanel}
        />
        <main
          id="settings-content"
          className="home-main rounded-tl-2xl flex min-w-0 flex-1 flex-col"
        >
            <UtilityHeader
              title="Settings"
              {...mobileNavigation}
            />

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-7">
              <div className="grid w-full gap-4">
                {apiKeysQuery.isError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                    Could not load saved API keys.
                  </p>
                ) : null}
                {patchError ? (
                  <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {patchError}
                  </p>
                ) : null}

                <ApiKeySection
                  title="API keys"
                  description="Add a provider key, select which one powers the AI, and choose a model for each key."
                  items={apiKeys}
                  onSave={createApiKey}
                  onDelete={deleteApiKey}
                  keyPlaceholder="Paste API key"
                  listLabel="api-keys"
                  onSelectActive={selectActiveKey}
                  onUpdate={patchApiKey}
                  patchingId={patchingId}
                />
              </div>
            </div>
        </main>
      </div>
    </div>
  );
}
