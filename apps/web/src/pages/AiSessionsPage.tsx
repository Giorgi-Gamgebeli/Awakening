import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { ConversationPanel, UtilityHeader, focusRing } from "../components/home";
import { AgentSessionsPanel } from "../components/home/AgentSessionsPanel";
import { orpc } from "../lib/orpc";
import "./HomePage.css";

export function AiSessionsPage() {
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionsQuery = useQuery(
    orpc.agent.sessions.list.queryOptions({ input: { limit: 30 } }),
  );
  const sessionsListKey = orpc.agent.sessions.list.queryKey({
    input: { limit: 30 },
  });
  const renameMutation = useMutation(orpc.agent.sessions.rename.mutationOptions());
  const setPinnedMutation = useMutation(
    orpc.agent.sessions.setPinned.mutationOptions(),
  );
  const deleteMutation = useMutation(orpc.agent.sessions.delete.mutationOptions());

  useEffect(() => {
    document.title = "System | Awakening";
  }, []);

  function refreshSessions() {
    void queryClient.invalidateQueries({ queryKey: sessionsListKey });
  }

  function closeMobilePanel() {
    setMobilePanelOpen(false);
    requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
  }

  return (
    <div className="home-shell flex min-h-[100dvh] font-body text-content antialiased">
      <a href="#sessions-content" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-system focus:px-3 focus:py-2 focus:text-on-system">
        Skip to sessions
      </a>
      <div className="flex min-w-0 flex-1">
        <ConversationPanel mobileOpen={mobilePanelOpen} onClose={closeMobilePanel} />
        <main id="sessions-content" className="home-main rounded-tl-2xl flex min-w-0 flex-1 flex-col">
          <UtilityHeader
            title="System"
            subtitle="Sessions"
            onOpenMenu={() => setMobilePanelOpen(true)}
            menuButtonRef={mobileMenuButtonRef}
            menuOpen={mobilePanelOpen}
          >
            <button
              type="button"
              onClick={() => navigate("/home/ai/new")}
              className={`flex min-h-11 items-center gap-2 rounded-xl bg-system px-4 text-sm font-semibold text-on-system ${focusRing}`}
            >
              <Plus size={17} aria-hidden="true" />
              New chat
            </button>
          </UtilityHeader>
          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7">
            <div className="w-full">
              <AgentSessionsPanel
                layout="page"
                sessions={sessionsQuery.data?.items ?? []}
                activeId={null}
                isLoading={sessionsQuery.isLoading}
                onSelect={(id) => navigate(`/home/ai/${id}`)}
                onNew={() => navigate("/home/ai/new")}
                onRename={(id, title) => renameMutation.mutate({ id, title }, { onSuccess: refreshSessions })}
                onSetPinned={(id, isPinned) => setPinnedMutation.mutate({ id, isPinned }, { onSuccess: refreshSessions })}
                onDelete={(id) => deleteMutation.mutate({ id }, { onSuccess: refreshSessions })}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
