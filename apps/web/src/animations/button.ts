import type { Variants } from "framer-motion";
import { systemEase } from "./shared";

export function createPerimeterVariants(reduceMotion: boolean): Variants {
  return {
    idle: { opacity: 0, offsetDistance: "0%" },
    hover: reduceMotion
      ? { opacity: 1 }
      : {
          opacity: 1,
          offsetDistance: ["0%", "100%"],
          transition: {
            opacity: { duration: 0.16 },
            offsetDistance: {
              duration: 1.8,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
            },
          },
        },
    tap: { opacity: 1 },
    disabled: { opacity: 0, offsetDistance: "0%" },
  };
}

export const surfaceVariants: Variants = {
  idle: { inset: "1px", backgroundColor: "var(--color-system)" },
  hover: {
    inset: "1px",
    backgroundColor: "var(--color-system-hover)",
    transition: { duration: 0.28, ease: systemEase },
  },
  tap: {
    inset: "2px",
    backgroundColor: "var(--color-system-hover)",
    transition: { duration: 0.09 },
  },
  disabled: { inset: "1px", backgroundColor: "var(--color-system)" },
};
