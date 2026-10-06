import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Cable, Send, Sparkles } from "lucide-react";
import { ApiKeysProviderSchema } from "@repo/zod";
import { SignalRail, UtilityHeader, focusRing } from "../components/home";
import { orpc } from "../lib/orpc";
import "./HomePage.css";

export function AiPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<number>();
  const [selectedModelId, setSelectedModelId] = useState<string>();
  const apiKeysQuery = useQuery(orpc.apiKeys.findMany.queryOptions());
  const chatMutation = useMutation(orpc.agent.chat.mutationOptions());

  useEffect(() => {
    document.title = "AI | Awakening";
  }, []);

  const agentKeys = (apiKeysQuery.data ?? []).filter((apiKey) => {
    return (
      apiKey.purpose === "AGENT" &&
      ApiKeysProviderSchema.safeParse(apiKey.provider).success
    );
  });
  const selectedApiKey =
    agentKeys.find((apiKey) => apiKey.id === selectedApiKeyId) ?? agentKeys[0];
  const modelsQuery = useQuery({
    ...orpc.agent.models.queryOptions({
      input: { apiKeyId: selectedApiKey?.id ?? 1 },
    }),
    enabled: Boolean(selectedApiKey),
  });
  const models = modelsQuery.data ?? [];
  const { refetch: refetchModels } = modelsQuery;
  const selectedModel =
    models.find((model) => model.id === selectedModelId) ?? models[0];
  const canSend = Boolean(selectedApiKey && selectedModel && prompt.trim());

  useEffect(() => {
    if (chatMutation.isError) void refetchModels();
  }, [chatMutation.isError, refetchModels]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedApiKey || !selectedModel || !prompt.trim()) return;

    chatMutation.mutate({
      text: prompt,
      apiKeyId: selectedApiKey.id,
      model: selectedModel.id,
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
      <SignalRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main
            id="ai-content"
            className="home-main flex min-w-0 flex-1 flex-col"
          >
            <UtilityHeader
              title="AI workspace"
              subtitle="MCP-assisted conversations"
            >
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[0.6875rem] font-bold tracking-[0.08em] text-accent-bright">
                {selectedApiKey ? "READY" : "NO AGENT KEY"}
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-content-muted">
                    API key
                    <select
                      value={selectedApiKey?.id ?? ""}
                      onChange={(event) =>
                        setSelectedApiKeyId(Number(event.target.value))
                      }
                      disabled={!agentKeys.length || chatMutation.isPending}
                      className={`min-h-11 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-content disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                    >
                      {!agentKeys.length ? (
                        <option>No supported agent key</option>
                      ) : null}
                      {agentKeys.map((apiKey) => (
                        <option key={apiKey.id} value={apiKey.id}>
                          {apiKey.provider} key #{apiKey.id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-content-muted">
                    Model
                    <select
                      value={selectedModel?.id ?? ""}
                      onChange={(event) =>
                        setSelectedModelId(event.target.value)
                      }
                      disabled={
                        !selectedApiKey ||
                        modelsQuery.isLoading ||
                        chatMutation.isPending
                      }
                      className={`min-h-11 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-content disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                    >
                      {!models.length ? (
                        <option>
                          {modelsQuery.isLoading
                            ? "Loading models…"
                            : "No compatible model"}
                        </option>
                      ) : null}
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex gap-3">
                  <label className="sr-only" htmlFor="ai-prompt">
                    Ask the AI assistant
                  </label>
                  <input
                    id="ai-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    disabled={!selectedApiKey || chatMutation.isPending}
                    placeholder={
                      selectedApiKey
                        ? "Ask the AI assistant"
                        : "Add an agent key in Settings first"
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
    </div>
  );
}
