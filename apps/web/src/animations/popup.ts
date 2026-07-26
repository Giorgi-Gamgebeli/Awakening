import type { Variants } from "framer-motion";
import { systemEase } from "./shared";

function withAlpha(color: string, opacity: number) {
  return `color-mix(in srgb, ${color} ${opacity}%, transparent)`;
}

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
    filter: ["blur(3px)", "blur(0px)", "blur(1px)", "blur(0px)", "blur(0px)"],
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

export const popupScreenGlitchVariants: Variants = {
  rest: {
    opacity: 1,
    x: 0,
    skewX: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    filter: "brightness(1) blur(0px)",
  },
  glitchInStart: {
    opacity: 0.8,
    x: 5,
    skewX: 0.7,
    clipPath: "inset(38% 0% 10% 0%)",
    filter: "brightness(1.9) blur(0.5px)",
  },
  glitchOut: {
    opacity: [1, 0.72, 0.94, 0.78],
    x: [0, -8, 6, -4],
    skewX: [0, -1.4, 0.9, -0.6],
    clipPath: [
      "inset(0% 0% 0% 0%)",
      "inset(9% 0% 47% 0%)",
      "inset(44% 0% 12% 0%)",
      "inset(18% 0% 34% 0%)",
    ],
    filter: [
      "brightness(1) blur(0px)",
      "brightness(2.2) blur(0.6px)",
      "brightness(0.7) blur(0px)",
      "brightness(1.8) blur(0.4px)",
    ],
    transition: {
      duration: 0.16,
      times: [0, 0.3, 0.62, 1],
      ease: "linear",
    },
  },
  glitchIn: {
    opacity: [0.8, 0.96, 0.74, 1],
    x: [5, -6, 3, 0],
    skewX: [0.7, -0.8, 0.35, 0],
    clipPath: [
      "inset(38% 0% 10% 0%)",
      "inset(12% 0% 42% 0%)",
      "inset(4% 0% 7% 0%)",
      "inset(0% 0% 0% 0%)",
    ],
    filter: [
      "brightness(1.9) blur(0.5px)",
      "brightness(0.75) blur(0px)",
      "brightness(1.45) blur(0.3px)",
      "brightness(1) blur(0px)",
    ],
    transition: {
      duration: 0.16,
      times: [0, 0.34, 0.7, 1],
      ease: "linear",
    },
  },
};

function createPopupScanVariants(destination: "0%" | "100%"): Variants {
  return {
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
  };
}

export const popupUpperScanVariants = createPopupScanVariants("0%");
export const popupLowerScanVariants = createPopupScanVariants("100%");
