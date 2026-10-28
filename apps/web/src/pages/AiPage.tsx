import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send } from "lucide-react";
import { ApiKeysProviderSchema } from "@repo/zod";
import {
  ConversationPanel,
  UtilityHeader,
  focusRing,
} from "../components/home";
import { MessageBubble } from "../components/home/MessageBubble";
import type { Message } from "../components/home/types";
import { orpc } from "../lib/orpc";
import "./HomePage.css";

const aiFriend = {
  id: "ai-assistant",
  userName: "System",
  status: "ONLINE",
  initials: "SY",
  tone: "home-avatar",
} as const;

type LocalMessage = Message & { pending?: boolean };

export function AiPage() {
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [prompt, setPrompt] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const activeSessionId = sessionId === "new" ? null : (sessionId ?? null);
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const apiKeysQuery = useQuery(orpc.apiKeys.findMany.queryOptions());
  const chatMutation = useMutation(orpc.agent.chat.mutationOptions());
  const detailQuery = useQuery({
    ...orpc.agent.sessions.messages.queryOptions({
      input: {
        id: activeSessionId ?? "00000000-0000-0000-0000-000000000000",
        limit: 50,
      },
    }),
    enabled: Boolean(activeSessionId),
  });
  const sessionsListKey = orpc.agent.sessions.list.queryKey({
    input: { limit: 30 },
  });

  useEffect(() => {
    document.title = "System | Awakening";
  }, []);

  const agentKeys = (apiKeysQuery.data ?? []).filter((apiKey) => {
    return ApiKeysProviderSchema.safeParse(apiKey.provider).success;
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

  const persistedMessages: LocalMessage[] = useMemo(() => {
    if (!detailQuery.data) return [];
    return detailQuery.data.items.map((m) => ({
      id: m.id,
      own: m.role === "USER",
      text: m.content,
    }));
  }, [detailQuery.data]);

  const messages = [...persistedMessages, ...localMessages];
  const canSend = Boolean(selectedApiKey && storedModelId && prompt.trim());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, chatMutation.isPending]);

  useEffect(() => {
    setLocalMessages([]);
    setPrompt("");
  }, [activeSessionId]);

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

  function handleNewChat() {
    setLocalMessages([]);
    setPrompt("");
    navigate("/home/ai/new");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = prompt.trim();
    if (!selectedApiKey || !storedModelId || !text) return;

    const optimisticId = crypto.randomUUID();
    setLocalMessages((items) => [
      ...items,
      { id: optimisticId, own: true, text, pending: true },
    ]);
    setPrompt("");
    chatMutation.mutate(
      {
        text,
        apiKeyId: selectedApiKey.id,
        model: storedModelId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...(activeSessionId ? { sessionId: activeSessionId } : {}),
      },
      {
        onSuccess(response) {
          // Backend is source of truth: adopt canonical session id, then
          // reconcile local state against persisted history.
          navigate(`/home/ai/${response.sessionId}`, { replace: true });
          setLocalMessages([]);
          void queryClient.invalidateQueries({ queryKey: sessionsListKey });
          void detailQuery.refetch();
        },
        onError() {
          setLocalMessages((items) =>
            items.filter((m) => m.id !== optimisticId),
          );
        },
      },
    );
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
          <UtilityHeader title="System" {...mobileNavigation}>
            <button
              type="button"
              onClick={handleNewChat}
              className={`grid size-11 place-items-center rounded-xl text-content-subtle transition-colors hover:bg-surface-raised hover:text-content ${focusRing}`}
              aria-label="Start new chat"
              title="New chat"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </UtilityHeader>

          {!selectedApiKey ? (
            <section className="flex min-h-0 flex-1 items-center justify-center px-4 py-6 text-center text-sm text-content-muted sm:px-7">
              <p>
                Add an API key to start chatting.{" "}
                <Link
                  to="/home/settings"
                  className={`font-semibold text-system underline-offset-2 hover:underline ${focusRing}`}
                >
                  Go to Settings
                </Link>
              </p>
            </section>
          ) : (
            <div className="flex min-h-0 flex-1">
              <section className="flex min-h-0 flex-1 flex-col">
                <div
                  className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-7"
                  aria-live="polite"
                >
                  <div className="flex-1" />
                  {activeSessionId && detailQuery.isLoading ? (
                    <p className="text-center text-sm text-content-subtle">
                      Loading conversation…
                    </p>
                  ) : (
                    messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        friend={aiFriend}
                      />
                    ))
                  )}
                  {chatMutation.isPending ? (
                    <MessageBubble
                      message={{
                        id: "thinking",
                        own: false,
                        text: "Thinking…",
                      }}
                      friend={aiFriend}
                    />
                  ) : null}
                  {modelsQuery.isError ? (
                    <p role="alert" className="text-sm text-danger">
                      Could not load models for this API key.
                    </p>
                  ) : null}
                  {chatMutation.isError ? (
                    <p role="alert" className="text-sm text-danger">
                      {chatMutation.error instanceof Error &&
                      chatMutation.error.message
                        ? chatMutation.error.message
                        : "The system request failed. Check that this provider key can use the selected model."}
                    </p>
                  ) : null}
                  <div ref={bottomRef} />
                </div>

                <form
                  className="mx-auto grid w-full max-w-3xl gap-3 px-4 pt-3 pb-6 sm:px-7"
                  onSubmit={handleSubmit}
                >
                  <div className="flex gap-3">
                    <label className="sr-only" htmlFor="ai-prompt">
                      Ask the system
                    </label>
                    <input
                      id="ai-prompt"
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      disabled={!storedModelId || chatMutation.isPending}
                      placeholder={
                        !storedModelId
                          ? "Select a model for this key in Settings first"
                          : activeSessionId
                            ? "Reply in this chat"
                            : "Ask the system — a new chat will be created"
                      }
                      className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-content placeholder:text-content-subtle disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    <button
                      type="submit"
                      disabled={!canSend || chatMutation.isPending}
                      className={`grid size-12 shrink-0 place-items-center rounded-xl bg-system text-on-system disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
                      aria-label="Send system prompt"
                    >
                      <Send size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-content-muted">
                    <span>
                      Model: {selectedModel?.label ?? storedModelId ?? "None"}
                    </span>
                    <span>Effort: {selectedApiKey.reasoningEffort}</span>
                  </div>
                </form>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
