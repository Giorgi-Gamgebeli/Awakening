import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Plus, Send, Volume2, VolumeX } from "lucide-react";
import { ApiKeysProviderSchema } from "@repo/zod";
import {
  ConversationPanel,
  UtilityHeader,
  focusRing,
} from "../components/home";
import { MessageBubble } from "../components/home/MessageBubble";
import type { Message } from "../components/home/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { orpc } from "../lib/orpc";
import { useSpeechRecognition, useSpeechSynthesis } from "../hooks/useVoice";
import "./HomePage.css";

const aiFriend = {
  id: "ai-assistant",
  userName: "System",
  status: "ONLINE",
  initials: "SY",
  tone: "home-avatar",
} as const;

type LocalMessage = Message & { pending?: boolean };

const voiceOutputPreferenceKey = "ai-voice-output";

function getInitialVoiceOutput() {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(voiceOutputPreferenceKey);
    if (stored !== null) return stored === "true";
  } catch {
    // Storage can be unavailable in private modes; fall back to the default.
  }
  return true;
}

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
  const hasGeminiKey = (apiKeysQuery.data ?? []).some(
    (apiKey) => apiKey.provider === "GEMINI",
  );
  const speechOutput = useSpeechSynthesis({
    geminiAvailable: hasGeminiKey,
  });
  const cancelSpeech = speechOutput.cancel;
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(
    getInitialVoiceOutput,
  );
  const speechInput = useSpeechRecognition({
    onTranscript(text) {
      if (selectedApiKey && storedModelId && !chatMutation.isPending) {
        sendMessage(text);
        return;
      }
      setPrompt((current) =>
        current.trim() ? `${current.trim()} ${text}` : text,
      );
    },
  });
  const naturalVoices = speechOutput.voices.filter(
    (voice) => voice.engine === "browser" && voice.natural,
  );
  const standardVoices = speechOutput.voices.filter(
    (voice) => voice.engine === "browser" && !voice.natural,
  );
  const googleVoices = speechOutput.voices.filter(
    (voice) => voice.engine === "gemini",
  );
  const edgeVoices = speechOutput.voices.filter(
    (voice) => voice.engine === "edge",
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        voiceOutputPreferenceKey,
        String(voiceOutputEnabled),
      );
    } catch {
      // Ignore storage failures; the preference still applies this session.
    }
    if (!voiceOutputEnabled) cancelSpeech();
  }, [voiceOutputEnabled, cancelSpeech]);

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

  function handleVoiceInput() {
    if (speechInput.isListening) {
      speechInput.stop();
      return;
    }
    speechOutput.cancel();
    speechInput.start();
  }

  function handleVoiceChange(voiceId: string) {
    speechOutput.setVoice(voiceId);
    speechOutput.speak(
      voiceId.startsWith("edge:") || voiceId.startsWith("gemini:")
        ? "გამარჯობა, ასე ჟღერს ჩემი ხმა."
        : "Hi, this is how I will sound when I reply.",
    );
  }

  function sendMessage(rawText: string) {
    const text = rawText.trim();
    if (!selectedApiKey || !storedModelId || !text || chatMutation.isPending) {
      return;
    }

    speechInput.stop();
    speechOutput.cancel();

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
          const replyText =
            response.status === "success" ? response.text : response.message;
          if (voiceOutputEnabled && replyText) {
            speechOutput.speak(replyText);
          }

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(prompt);
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
              onClick={() => setVoiceOutputEnabled((enabled) => !enabled)}
              disabled={!speechOutput.supported}
              className={`grid size-11 place-items-center rounded-xl transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-45 ${
                voiceOutputEnabled
                  ? "text-system"
                  : "text-content-subtle hover:text-content"
              } ${focusRing}`}
              aria-pressed={voiceOutputEnabled}
              aria-label={
                voiceOutputEnabled
                  ? "Turn off spoken replies"
                  : "Turn on spoken replies"
              }
              title={
                speechOutput.supported
                  ? voiceOutputEnabled
                    ? "Spoken replies on"
                    : "Spoken replies off"
                  : "Spoken replies are not supported in this browser"
              }
            >
              {voiceOutputEnabled ? (
                <Volume2 size={18} aria-hidden="true" />
              ) : (
                <VolumeX size={18} aria-hidden="true" />
              )}
            </button>
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
                      type="button"
                      onClick={handleVoiceInput}
                      disabled={
                        !storedModelId ||
                        chatMutation.isPending ||
                        !speechInput.supported
                      }
                      className={`grid size-12 shrink-0 place-items-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${focusRing} ${
                        speechInput.isListening
                          ? "border-danger bg-danger/15 text-danger"
                          : "border-border bg-surface-raised text-content-muted hover:text-content"
                      }`}
                      aria-pressed={speechInput.isListening}
                      aria-label={
                        speechInput.isListening
                          ? "Stop voice input"
                          : "Start voice input"
                      }
                      title={
                        speechInput.supported
                          ? speechInput.isListening
                            ? "Stop listening"
                            : "Speak your message"
                          : "Voice input is not supported in this browser"
                      }
                    >
                      {speechInput.isListening ? (
                        <MicOff size={18} aria-hidden="true" />
                      ) : (
                        <Mic size={18} aria-hidden="true" />
                      )}
                    </button>
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
                    {voiceOutputEnabled ? (
                      speechOutput.voices.length ? (
                        <div className="flex items-center gap-1.5">
                          <span>Voice</span>
                          <Select
                            value={speechOutput.selectedVoice?.id ?? ""}
                            onValueChange={handleVoiceChange}
                          >
                            <SelectTrigger
                              aria-label="Reply voice"
                              className="h-8 min-h-8 w-auto max-w-48 gap-1 rounded-lg px-2 text-xs sm:max-w-64 [&>span]:truncate"
                            >
                              <SelectValue placeholder="System default" />
                            </SelectTrigger>
                            <SelectContent className="max-w-80">
                              {googleVoices.length ? (
                                <SelectGroup>
                                  <SelectLabel className="text-content-muted">
                                    Georgian · Google (best quality)
                                  </SelectLabel>
                                  {googleVoices.map((voice) => (
                                    <SelectItem key={voice.id} value={voice.id}>
                                      {voice.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ) : null}
                              {edgeVoices.length ? (
                                <SelectGroup>
                                  <SelectLabel className="text-content-muted">
                                    Georgian · Edge (faster)
                                  </SelectLabel>
                                  {edgeVoices.map((voice) => (
                                    <SelectItem key={voice.id} value={voice.id}>
                                      {voice.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ) : null}
                              {naturalVoices.length ? (
                                <SelectGroup>
                                  <SelectLabel className="text-content-muted">
                                    Natural
                                  </SelectLabel>
                                  {naturalVoices.map((voice) => (
                                    <SelectItem key={voice.id} value={voice.id}>
                                      {voice.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ) : null}
                              {standardVoices.length ? (
                                <SelectGroup>
                                  <SelectLabel className="text-content-muted">
                                    Standard
                                  </SelectLabel>
                                  {standardVoices.map((voice) => (
                                    <SelectItem key={voice.id} value={voice.id}>
                                      {voice.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ) : null}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span>Voice: System default</span>
                      )
                    ) : null}
                    {speechInput.isListening ? (
                      <span
                        className="font-semibold text-danger"
                        aria-live="polite"
                      >
                        Listening
                        {speechInput.interimText
                          ? `: ${speechInput.interimText}`
                          : "…"}
                      </span>
                    ) : null}
                    {speechOutput.isSpeaking ? (
                      <span className="font-semibold text-system">
                        Speaking…
                      </span>
                    ) : null}
                    {speechInput.error ? (
                      <span role="alert" className="text-danger">
                        {speechInput.error}
                      </span>
                    ) : null}
                    {speechOutput.error ? (
                      <span role="alert" className="text-danger">
                        {speechOutput.error}
                      </span>
                    ) : null}
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
