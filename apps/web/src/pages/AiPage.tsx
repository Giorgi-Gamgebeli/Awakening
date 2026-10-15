import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { ApiKeysProviderSchema } from "@repo/zod";
import {
  ConversationPanel,
  UtilityHeader,
  focusRing,
} from "../components/home";
import { MessageBubble } from "../components/home/MessageBubble";
import type { Friend, Message } from "../components/home/types";
import { orpc } from "../lib/orpc";
import "./HomePage.css";

const aiFriend: Friend = {
  id: "ai-assistant",
  userName: "System",
  status: "ONLINE",
  initials: "SY",
  tone: "home-avatar",
};

export function AiPage() {
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const apiKeysQuery = useQuery(orpc.apiKeys.findMany.queryOptions());
  const chatMutation = useMutation(orpc.agent.chat.mutationOptions());

  useEffect(() => {
    document.title = "System | Awakening";
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

    const text = prompt.trim();
    if (!selectedApiKey || !storedModelId || !text) return;

    setMessages((items) => [
      ...items,
      { id: crypto.randomUUID(), own: true, text },
    ]);
    setPrompt("");
    chatMutation.mutate(
      {
        text,
        apiKeyId: selectedApiKey.id,
        model: storedModelId,
      },
      {
        onSuccess(response) {
          setMessages((items) => [
            ...items,
            {
              id: crypto.randomUUID(),
              own: false,
              text:
                response.status === "success" ? response.text : response.message,
            },
          ]);
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
            <UtilityHeader
              title="System"
              {...mobileNavigation}
            />

            {!selectedApiKey ? (
              <section className="flex min-h-0 flex-1 items-center justify-center px-4 py-6 text-center text-sm text-content-muted sm:px-7">
                <p>
                  Add an API key to start chatting. {" "}
                  <Link
                    to="/home/settings"
                    className={`font-semibold text-system underline-offset-2 hover:underline ${focusRing}`}
                  >
                    Go to Settings
                  </Link>
                </p>
              </section>
            ) : (
              <section className="flex min-h-0 flex-1 flex-col">
                <div
                  className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-7"
                  aria-live="polite"
                >
                  <div className="flex-1" />
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      friend={aiFriend}
                    />
                  ))}
                  {chatMutation.isPending ? (
                    <MessageBubble
                      message={{ id: "thinking", own: false, text: "Thinking…" }}
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
                      The system request failed. Check that this provider key can use
                      the selected model.
                    </p>
                  ) : null}
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
                          : "Ask the system"
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
            )}
        </main>
      </div>
    </div>
  );
}
