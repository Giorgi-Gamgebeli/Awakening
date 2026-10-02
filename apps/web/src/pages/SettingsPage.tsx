import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { ApiKeysCreateInputSchema } from "@repo/zod";
import type { z } from "@repo/zod";
import { SignalRail, UtilityHeader } from "../components/home";
import { ApiKeySection } from "../components/settings/ApiKeySection";
import { orpc } from "../lib/orpc";
import "./HomePage.css";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const apiKeysQuery = useQuery(orpc.findMany.queryOptions());
  const createApiKeyMutation = useMutation({
    ...orpc.create.mutationOptions(),
    onSuccess(createdKey) {
      queryClient.setQueryData(orpc.findMany.queryKey(), (current = []) => [
        ...current,
        createdKey,
      ]);
    },
  });
  const deleteApiKeyMutation = useMutation({
    ...orpc.delete.mutationOptions(),
    onSuccess(deletedKey) {
      queryClient.setQueryData(orpc.findMany.queryKey(), (current = []) =>
        current.filter((apiKey) => apiKey.id !== deletedKey.id),
      );
    },
  });

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
  const agentKeys = apiKeys.filter((apiKey) => apiKey.purpose === "AGENT");
  const translationKeys = apiKeys.filter(
    (apiKey) => apiKey.purpose === "TRANSLATION",
  );

  return (
    <div className="home-shell flex min-h-[100dvh] font-body text-content antialiased">
      <a
        href="#settings-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-system focus:px-3 focus:py-2 focus:text-on-system"
      >
        Skip to content
      </a>
      <SignalRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main
            id="settings-content"
            className="home-main flex min-w-0 flex-1 flex-col"
          >
            <UtilityHeader
              title="Settings"
              subtitle="Your providers and API keys"
            />

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-7">
              <div className="mx-auto grid w-full max-w-3xl gap-4">
                {apiKeysQuery.isError ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                    Could not load saved API keys.
                  </p>
                ) : null}
                <p className="flex items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-xs leading-5 text-content-muted">
                  <TriangleAlert
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-system"
                  />
                  Keys are encrypted and saved on the server. Their original
                  values are never returned to this browser.
                </p>

                <ApiKeySection
                  title="Agent keys"
                  description="Do the actual work in the app and connect to your MCP server. First key is primary, the rest are fallbacks."
                  items={agentKeys}
                  purpose="AGENT"
                  onSave={createApiKey}
                  onDelete={deleteApiKey}
                  providerPlaceholder="Provider label, e.g. OpenAI agent"
                  keyPlaceholder="Paste agent API key"
                  listLabel="agent-keys"
                />

                <ApiKeySection
                  title="Translation keys"
                  description="Handle translations when the work provider can't fully translate a language. E.g. Gemini translates, OpenAI does the work."
                  items={translationKeys}
                  purpose="TRANSLATION"
                  onSave={createApiKey}
                  onDelete={deleteApiKey}
                  providerPlaceholder="Provider label, e.g. Gemini translate"
                  keyPlaceholder="Paste translation API key"
                  listLabel="translation-keys"
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
