import { useEffect } from "react";
import { Bot, Cable, Send, Sparkles } from "lucide-react";
import { SignalRail, UtilityHeader, focusRing } from "../components/home";
import "./HomePage.css";

export function AiPage() {
  useEffect(() => {
    document.title = "AI | Awakening";
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
                OFFLINE
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
                    Connect a model provider and an MCP server to let the assistant answer questions and use your approved tools from this workspace.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border-subtle bg-canvas/45 p-4">
                      <Bot className="mb-3 text-system" size={19} aria-hidden="true" />
                      <h2 className="font-semibold text-content">Model provider</h2>
                      <p className="mt-1 text-sm leading-5 text-content-muted">Not configured</p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-canvas/45 p-4">
                      <Cable className="mb-3 text-accent-bright" size={19} aria-hidden="true" />
                      <h2 className="font-semibold text-content">MCP tools</h2>
                      <p className="mt-1 text-sm leading-5 text-content-muted">No server connected</p>
                    </div>
                  </div>
                </div>
              </div>

              <form className="mx-auto mt-6 flex w-full max-w-3xl gap-3" onSubmit={(event) => event.preventDefault()}>
                <label className="sr-only" htmlFor="ai-prompt">Ask the AI assistant</label>
                <input
                  id="ai-prompt"
                  disabled
                  placeholder="Connect AI to start a conversation"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-content placeholder:text-content-subtle disabled:cursor-not-allowed disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled
                  className={`grid size-12 shrink-0 place-items-center rounded-xl bg-system text-on-system disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
                  aria-label="Send AI prompt"
                >
                  <Send size={18} aria-hidden="true" />
                </button>
              </form>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
