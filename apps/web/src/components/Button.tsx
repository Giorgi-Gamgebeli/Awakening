import { motion, useReducedMotion } from "framer-motion";
import { createPerimeterVariants, surfaceVariants } from "../animations/button";
import { TargetLabel } from "./TargetLabel";

type ButtonProps = Readonly<{
  children: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}>;

export function Button({
  children,
  disabled = false,
  onClick,
  type = "button",
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const perimeterVariants = createPerimeterVariants(prefersReducedMotion);

  return (
    <motion.button
      className="relative isolate mx-auto flex h-12 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-0 bg-system/38 px-6 font-display text-[0.72rem] font-extrabold tracking-[0.18em] text-on-system outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-default disabled:opacity-[0.82]"
      type={type}
      onClick={onClick}
      disabled={disabled}
      initial="idle"
      animate={disabled ? "disabled" : "idle"}
      whileHover={disabled ? undefined : "hover"}
      whileFocus={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : "tap"}
    >
      <motion.span
        className="pointer-events-none absolute top-0 left-0 z-0 h-0.5 w-5 rounded-full bg-[linear-gradient(90deg,transparent,var(--color-system)_30%,var(--color-system-soft)_68%,var(--color-accent-bright))] [offset-path:inset(1px_round_0.4375rem)] [offset-rotate:auto]"
        variants={perimeterVariants}
        aria-hidden="true"
      />
      <motion.span
        className="pointer-events-none absolute z-10 rounded-[calc(0.5rem-1px)]"
        variants={surfaceVariants}
        aria-hidden="true"
      />
      <span className="relative z-20">
        <TargetLabel bracketTone="dark">{children}</TargetLabel>
      </span>
    </motion.button>
  );
}
