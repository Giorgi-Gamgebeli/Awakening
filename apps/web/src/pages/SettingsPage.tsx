import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { SignalRail, UtilityHeader } from "../components/home";
import { ApiKeySection } from "../components/settings/ApiKeySection";
import { loadApiKeys, saveApiKeys, type ApiKeyStore } from "../lib/apiKeys";
import "./HomePage.css";

export function SettingsPage() {
  const [stores, setStores] = useState<ApiKeyStore>(() => loadApiKeys());

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

  useEffect(() => {
    saveApiKeys(stores);
  }, [stores]);

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
                <p className="flex items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-xs leading-5 text-content-muted">
                  <TriangleAlert size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-system" />
                  Keys are stored only in this browser (localStorage) for now. The app tries priority 1 first and falls back down the list.
                </p>

                <ApiKeySection
                  title="Work keys"
                  description="Do the actual work in the app and connect to your MCP server. First key is primary, the rest are fallbacks."
                  items={stores.work}
                  onChange={(work) => setStores((prev) => ({ ...prev, work }))}
                  providerPlaceholder="Provider label, e.g. OpenAI work"
                  keyPlaceholder="Paste work API key"
                  listLabel="work-keys"
                />

                <ApiKeySection
                  title="Translation keys"
                  description="Handle translations when the work provider can't fully translate a language. E.g. Gemini translates, OpenAI does the work."
                  items={stores.translation}
                  onChange={(translation) =>
                    setStores((prev) => ({ ...prev, translation }))
                  }
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
