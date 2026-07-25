import { motion } from "framer-motion";
import { Link } from "react-router";
import { TargetLabel } from "./TargetLabel";

const MotionLink = motion.create(Link);

export function Navigation() {
  return (
    <nav
      className="absolute top-6 left-1/2 z-20 flex min-h-[3.35rem] w-[min(calc(100%-3rem),72rem)] -translate-x-1/2 items-center justify-between bg-[linear-gradient(90deg,transparent,--alpha(var(--color-accent)/7%)_14%,--alpha(var(--color-surface-raised)/72%)_32%_68%,--alpha(var(--color-accent)/7%)_86%,transparent)] px-[clamp(1.25rem,5vw,2.25rem)] pt-[0.9rem] pb-3 max-[480px]:top-4 max-[480px]:w-[calc(100%_-_2rem)]"
      aria-label="Primary navigation"
    >
      <span
        className="pointer-events-none absolute inset-x-[-0.15rem] top-0 h-[0.22rem] bg-[linear-gradient(90deg,var(--color-accent-deep),var(--color-accent)_34%,var(--color-accent-bright)_50%,var(--color-accent)_66%,var(--color-accent-deep))] shadow-[0_0_0.65rem_--alpha(var(--color-accent)/55%)] [clip-path:polygon(0_0,100%_0,98.5%_100%,70%_100%,67.5%_42%,32.5%_42%,30%_100%,1.5%_100%)]"
        aria-hidden="true"
      />
      <span className="font-display text-[0.7rem] font-extrabold tracking-[0.22em] text-content max-[480px]:text-[0.62rem]">
        AWAKENING
      </span>
      <MotionLink
        className="relative font-display text-[0.7rem] font-extrabold tracking-[0.22em] text-content-muted no-underline transition-colors duration-150 hover:text-content focus-visible:text-content focus-visible:outline-none max-[480px]:text-[0.62rem]"
        to="/"
        initial="idle"
        animate="idle"
        whileHover="hover"
        whileFocus="hover"
        whileTap="tap"
      >
        <TargetLabel>HOME</TargetLabel>
      </MotionLink>
    </nav>
  );
}
