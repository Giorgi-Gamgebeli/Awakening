import { motion } from "framer-motion";
import {
  leftBracketVariants,
  rightBracketVariants,
} from "../animations/targetLabel";

type TargetLabelProps = Readonly<{
  children: string;
  bracketTone?: "violet" | "dark";
}>;

export function TargetLabel({
  children,
  bracketTone = "violet",
}: TargetLabelProps) {
  const bracketColor =
    bracketTone === "dark" ? "text-on-system" : "text-accent-bright";

  return (
    <span className="relative inline-flex items-center justify-center">
      <motion.span
        className={`pointer-events-none absolute top-1/2 right-[calc(100%+0.35rem)] font-mono text-[0.72rem] font-medium leading-none ${bracketColor}`}
        variants={leftBracketVariants}
        aria-hidden="true"
      >
        [
      </motion.span>
      <span>{children}</span>
      <motion.span
        className={`pointer-events-none absolute top-1/2 left-[calc(100%+0.2rem)] font-mono text-[0.72rem] font-medium leading-none ${bracketColor}`}
        variants={rightBracketVariants}
        aria-hidden="true"
      >
        ]
      </motion.span>
    </span>
  );
}
