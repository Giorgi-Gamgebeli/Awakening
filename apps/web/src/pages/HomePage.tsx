import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  SignalRail,
  ConversationPanel,
  FriendsView,
  ChatView,
  friends,
} from "../components/home";
import "./HomePage.css";

export default function HomePage() {
  const { friendId } = useParams<{ friendId: string }>();
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const friend = friendId
    ? friends.find((item) => item.id === friendId)
    : undefined;

  const closeMobilePanel = useCallback(() => {
    setMobilePanelOpen(false);
    requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
  }, []);

  const mobileNavigation = {
    onOpenMenu: () => setMobilePanelOpen(true),
    menuButtonRef: mobileMenuButtonRef,
    menuOpen: mobilePanelOpen,
  };

  useEffect(() => {
    document.title = `${friend?.userName ?? "Friends"} | Awakening`;
  }, [friend]);

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
        href="#home-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-system focus:px-3 focus:py-2 focus:text-on-system"
      >
        Skip to content
      </a>
      <SignalRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ConversationPanel
            mobileOpen={mobilePanelOpen}
            onClose={closeMobilePanel}
          />
          <main
            id="home-content"
            className="home-main flex min-w-0 flex-1 flex-col"
          >
            {friend ? (
              <ChatView key={friend.id} friend={friend} {...mobileNavigation} />
            ) : (
              <FriendsView {...mobileNavigation} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
