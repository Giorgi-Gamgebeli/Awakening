import type { Variants } from "framer-motion";
import { systemEase } from "./shared";

function createBracketVariants(idleX: number, tapX: string): Variants {
  return {
    idle: { opacity: 0, x: idleX, y: "-50%" },
    hover: {
      opacity: 0.72,
      x: 0,
      y: "-50%",
      transition: { duration: 0.28, ease: systemEase },
    },
    tap: { opacity: 0.72, x: tapX, y: "-50%" },
    disabled: { opacity: 0, x: idleX, y: "-50%" },
  };
}

export const leftBracketVariants = createBracketVariants(-7, "0.1rem");
export const rightBracketVariants = createBracketVariants(7, "-0.1rem");
