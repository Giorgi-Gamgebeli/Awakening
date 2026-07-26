import { AnimatePresence, motion, type Variants } from "framer-motion";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  popupContentVariants,
  popupLowerScanVariants,
  popupScreenGlitchVariants,
  popupShellVariants,
  popupUpperScanVariants,
} from "../animations/popup";
import { systemEase } from "../animations/shared";
import { CpuIcon } from "./CpuIcon";

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.12, ease: systemEase },
  },
  exit: {
    opacity: [1, 1, 0],
    transition: {
      duration: 0.42,
      times: [0, 0.8, 1],
      ease: systemEase,
    },
  },
};

type SystemWindowProps<TScreen extends string> = Readonly<{
  activeScreen: TScreen | null;
  screens: Record<TScreen, ReactNode>;
  overlay?: boolean;
  onExitComplete?: () => void;
}>;

function SystemWindow<TScreen extends string>({
  activeScreen,
  screens,
  overlay = true,
  onExitComplete,
}: SystemWindowProps<TScreen>) {
  const isOpen = activeScreen !== null;
  const screenKeys = Object.keys(screens) as TScreen[];

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {isOpen ? (
        <motion.div
          className={`fixed inset-0 z-50 grid place-items-center overflow-y-auto px-6 py-24 max-[480px]:px-4 max-[480px]:py-20 ${
            overlay ? "bg-canvas/80 backdrop-blur-sm" : ""
          }`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
        >
          <dialog
            className="relative z-10 m-0 w-full max-w-none border-0 bg-transparent p-0 text-inherit"
            open
            aria-modal="true"
            aria-labelledby="system-message-title"
          >
            <motion.section
              className="relative mx-auto w-full max-w-136 overflow-hidden rounded bg-[linear-gradient(145deg,--alpha(var(--color-accent-bright)/58%),--alpha(var(--color-accent)/16%)_48%,--alpha(var(--color-accent-deep)/52%))] p-px shadow-[0_2rem_7rem_--alpha(var(--color-shadow)/58%),0_0_3rem_--alpha(var(--color-accent)/10%)]"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={popupShellVariants}
            >
              <div className="rounded-[calc(0.25rem-1px)] bg-[linear-gradient(145deg,var(--color-surface-raised),var(--color-surface))] p-[clamp(1.5rem,5vw,2.5rem)]">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={popupContentVariants}
                >
                  <header className="flex items-center justify-between gap-4 border-b border-content-muted/[14%] pb-5">
                    <div className="flex items-center gap-3 font-display text-[0.82rem] font-extrabold tracking-[0.24em] text-content">
                      <CpuIcon />
                      <span id="system-message-title">SYSTEM MESSAGE</span>
                    </div>
                  </header>
                  {screenKeys.map((screen) => (
                    <motion.div
                      key={screen}
                      hidden={screen !== activeScreen}
                      initial={
                        screen === activeScreen ? "glitchInStart" : false
                      }
                      animate={screen === activeScreen ? "glitchIn" : "rest"}
                      variants={popupScreenGlitchVariants}
                    >
                      {screens[screen]}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              <motion.span
                className="pointer-events-none absolute right-0 left-0 z-20 h-px origin-center bg-[linear-gradient(90deg,transparent,var(--color-accent)_20%,var(--color-content)_50%,var(--color-accent)_80%,transparent)] shadow-[0_0_0.8rem_--alpha(var(--color-accent)/78%)]"
                variants={popupUpperScanVariants}
                aria-hidden="true"
              />
              <motion.span
                className="pointer-events-none absolute right-0 left-0 z-20 h-px origin-center bg-[linear-gradient(90deg,transparent,var(--color-accent)_20%,var(--color-content)_50%,var(--color-accent)_80%,transparent)] shadow-[0_0_0.8rem_--alpha(var(--color-accent)/78%)]"
                variants={popupLowerScanVariants}
                aria-hidden="true"
              />
            </motion.section>
          </dialog>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export default SystemWindow;
