import type { Variants } from "framer-motion";
import { systemEase } from "./shared";

const withAlpha = (color: string, opacity: number) =>
  `color-mix(in srgb, ${color} ${opacity}%, transparent)`;

export const popupShellVariants: Variants = {
  hidden: {
    clipPath: "inset(49.8% 50% 49.8% 50%)",
    filter: "brightness(2.2)",
    opacity: 0.45,
  },
  visible: {
    clipPath: [
      "inset(49.8% 50% 49.8% 50%)",
      "inset(49.8% 0% 49.8% 0%)",
      "inset(0% 0% 0% 0%)",
    ],
    filter: ["brightness(2.2)", "brightness(1.55)", "brightness(1)"],
    opacity: [0.45, 1, 1],
    boxShadow: [
      "0 0 0 transparent",
      `0 0 2.5rem ${withAlpha("var(--color-accent)", 24)}`,
      `0 2rem 7rem ${withAlpha("var(--color-shadow)", 58)}, 0 0 3rem ${withAlpha("var(--color-accent)", 10)}`,
    ],
    transition: {
      duration: 0.46,
      times: [0, 0.32, 1],
      ease: systemEase,
    },
  },
  exit: {
    clipPath: [
      "inset(0% 0% 0% 0%)",
      "inset(49.8% 0% 49.8% 0%)",
      "inset(49.8% 50% 49.8% 50%)",
    ],
    filter: ["brightness(1)", "brightness(1.55)", "brightness(2.2)"],
    opacity: [1, 1, 0.45],
    boxShadow: [
      `0 2rem 7rem ${withAlpha("var(--color-shadow)", 58)}, 0 0 3rem ${withAlpha("var(--color-accent)", 10)}`,
      `0 0 2.5rem ${withAlpha("var(--color-accent)", 24)}`,
      "0 0 0 transparent",
    ],
    transition: {
      duration: 0.38,
      times: [0, 0.64, 1],
      ease: systemEase,
    },
  },
};

export const popupContentVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(3px)" },
  visible: {
    opacity: [0, 0.2, 0, 0.72, 1],
    filter: [
      "blur(3px)",
      "blur(0px)",
      "blur(1px)",
      "blur(0px)",
      "blur(0px)",
    ],
    transition: {
      delay: 0.27,
      duration: 0.22,
      times: [0, 0.22, 0.34, 0.68, 1],
      ease: "linear",
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(2px)",
    transition: { duration: 0.12, ease: "linear" },
  },
};

const createPopupScanVariants = (
  destination: "0%" | "100%",
): Variants => ({
  hidden: { top: "50%", scaleX: 0.04, opacity: 0 },
  visible: {
    top: ["50%", "50%", destination, destination],
    scaleX: [0.04, 1, 1, 1],
    opacity: [0, 0.86, 0.76, 0],
    transition: {
      delay: 0.02,
      duration: 0.56,
      times: [0, 0.22, 0.84, 1],
      ease: systemEase,
    },
  },
});

export const popupUpperScanVariants = createPopupScanVariants("0%");
export const popupLowerScanVariants = createPopupScanVariants("100%");
