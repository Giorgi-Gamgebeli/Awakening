import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Cable, Send, Sparkles } from "lucide-react";
import { ApiKeysProviderSchema } from "@repo/zod";
import {
  ConversationPanel,
  UtilityHeader,
  focusRing,
} from "../components/home";
import { orpc } from "../lib/orpc";
import "./HomePage.css";

export function AiPage() {
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [prompt, setPrompt] = useState("");
  const apiKeysQuery = useQuery(orpc.apiKeys.findMany.queryOptions());
  const chatMutation = useMutation(orpc.agent.chat.mutationOptions());

  useEffect(() => {
    document.title = "AI | Awakening";
  }, []);

  const agentKeys = (apiKeysQuery.data ?? []).filter((apiKey) => {
    return (
      ApiKeysProviderSchema.safeParse(apiKey.provider).success
    );
  });
  const selectedApiKey =
    agentKeys.find((apiKey) => apiKey.isActive) ?? agentKeys[0];
  const modelsQuery = useQuery({
    ...orpc.agent.models.queryOptions({
      input: { apiKeyId: selectedApiKey?.id ?? 1 },
    }),
    enabled: Boolean(selectedApiKey),
  });
  const models = modelsQuery.data ?? [];
  const { refetch: refetchModels } = modelsQuery;
  const storedModelId = selectedApiKey?.selectedModel ?? undefined;
  const selectedModel = models.find((model) => model.id === storedModelId);
  const canSend = Boolean(selectedApiKey && storedModelId && prompt.trim());

  function closeMobilePanel() {
    setMobilePanelOpen(false);
    requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
  }

  const mobileNavigation = {
    onOpenMenu: () => setMobilePanelOpen(true),
    menuButtonRef: mobileMenuButtonRef,
    menuOpen: mobilePanelOpen,
  };

  useEffect(() => {
    if (chatMutation.isError) void refetchModels();
  }, [chatMutation.isError, refetchModels]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedApiKey || !storedModelId || !prompt.trim()) return;

    chatMutation.mutate({
      text: prompt,
      apiKeyId: selectedApiKey.id,
      model: storedModelId,
    });
  }

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

  return (
    <div className="home-shell flex min-h-[100dvh] font-body text-content antialiased">
      <a
        href="#ai-content"
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
          id="ai-content"
          className="home-main rounded-tl-2xl flex min-w-0 flex-1 flex-col"
        >
            <UtilityHeader
              title="AI workspace"
              subtitle="MCP-assisted conversations"
              {...mobileNavigation}
            >
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[0.6875rem] font-bold tracking-[0.08em] text-accent-bright">
                {selectedApiKey ? "READY" : "NO API KEY"}
              </span>
            </UtilityHeader>

            <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-7">
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_18px_50px_color-mix(in_srgb,#000_28%,transparent)] sm:p-8">
                  <div className="mb-6 grid size-12 place-items-center rounded-xl bg-accent/16 text-accent-bright">
                    <Sparkles size={23} aria-hidden="true" />
                  </div>
                  <h1 className="font-display text-2xl font-black tracking-tight text-content">
                    Your AI workspace is ready.
                  </h1>
                  <p className="mt-3 max-w-xl leading-6 text-content-muted">
                    Connect a model provider and an MCP server to let the
                    assistant answer questions and use your approved tools from
                    this workspace.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border-subtle bg-canvas/45 p-4">
                      <Bot
                        className="mb-3 text-system"
                        size={19}
                        aria-hidden="true"
                      />
                      <h2 className="font-semibold text-content">
                        Model provider
                      </h2>
                      <p className="mt-1 text-sm leading-5 text-content-muted">
                        {selectedApiKey
                          ? selectedApiKey.provider
                          : "Not configured"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-canvas/45 p-4">
                      <Cable
                        className="mb-3 text-accent-bright"
                        size={19}
                        aria-hidden="true"
                      />
                      <h2 className="font-semibold text-content">MCP tools</h2>
                      <p className="mt-1 text-sm leading-5 text-content-muted">
                        No server connected
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <form
                className="mx-auto mt-6 grid w-full max-w-3xl gap-3"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-content-muted">
                  <span>
                    Using{" "}
                    {selectedApiKey
                      ? `${selectedApiKey.provider} key #${selectedApiKey.id}`
                      : "no API key"}
                  </span>
                  <span>
                    {storedModelId
                      ? `Model: ${selectedModel?.label ?? storedModelId}`
                      : "No model selected"}
                  </span>
                  <Link
                    to="/home/settings"
                    className={`font-semibold text-system underline-offset-2 hover:underline ${focusRing}`}
                  >
                    Change in Settings
                  </Link>
                </div>
                <div className="flex gap-3">
                  <label className="sr-only" htmlFor="ai-prompt">
                    Ask the AI assistant
                  </label>
                  <input
                    id="ai-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    disabled={
                      !selectedApiKey || !storedModelId || chatMutation.isPending
                    }
                    placeholder={
                      !selectedApiKey
                        ? "Add an API key in Settings first"
                        : !storedModelId
                          ? "Select a model for this key in Settings first"
                          : "Ask the AI assistant"
                    }
                    className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-content placeholder:text-content-subtle disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  <button
                    type="submit"
                    disabled={!canSend || chatMutation.isPending}
                    className={`grid size-12 shrink-0 place-items-center rounded-xl bg-system text-on-system disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
                    aria-label="Send AI prompt"
                  >
                    <Send size={18} aria-hidden="true" />
                  </button>
                </div>
              </form>
              {chatMutation.isPending ? (
                <p className="mx-auto mt-3 w-full max-w-3xl text-sm text-content-muted">
                  Generating response…
                </p>
              ) : null}
              {modelsQuery.isError ? (
                <p
                  role="alert"
                  className="mx-auto mt-3 w-full max-w-3xl text-sm text-danger"
                >
                  Could not load models for this API key.
                </p>
              ) : null}
              {chatMutation.isError ? (
                <p
                  role="alert"
                  className="mx-auto mt-3 w-full max-w-3xl text-sm text-danger"
                >
                  The AI request failed. Check that this provider key can use
                  the selected model.
                </p>
              ) : null}
              {chatMutation.data ? (
                <article className="mx-auto mt-3 w-full max-w-3xl rounded-2xl border border-border bg-surface p-4 text-sm leading-6 text-content">
                  {chatMutation.data.status === "success"
                    ? chatMutation.data.text
                    : chatMutation.data.message}
                </article>
              ) : null}
            </section>
        </main>
      </div>
    </div>
  );
}
