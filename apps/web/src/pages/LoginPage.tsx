import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router";
import LoginForm from "../components/LoginForm";
import { Navigation } from "../components/Navigation";
import SystemWindow from "../components/SystemWindow";

type AuthWindowScreen = "auth";

export function LoginPage() {
  const [activeWindow, setActiveWindow] = useState<AuthWindowScreen | null>(
    "auth",
  );
  const navigate = useNavigate();

  function goHome() {
    navigate("/home", { replace: true });
  }

  function closeWindow() {
    setActiveWindow(null);
  }

  function finishWindowClose() {
    navigate("/register");
  }

  return (
    <main className="relative grid min-h-svh min-w-80 place-items-center overflow-hidden bg-canvas bg-[radial-gradient(circle_at_50%_48%,--alpha(var(--color-system)/7%),transparent_34rem)] px-6 pt-28 pb-6 font-body text-content antialiased [color-scheme:dark] max-[480px]:px-4 max-[480px]:pt-[6.25rem] max-[480px]:pb-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_35%,--alpha(var(--color-canvas)/58%)_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-120 w-120 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <motion.div
          className="h-full w-full rounded-full bg-system/10 blur-[6rem]"
          animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.35, 1] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
      <Navigation />
      <SystemWindow<AuthWindowScreen>
        activeScreen={activeWindow}
        overlay={false}
        onExitComplete={finishWindowClose}
        screens={{
          auth: (
            <LoginForm
              onAuthenticated={goHome}
              onCreateProfile={closeWindow}
            />
          ),
        }}
      />
    </main>
  );
}
