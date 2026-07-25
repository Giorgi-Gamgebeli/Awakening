import { Cpu } from "lucide-react";

export function CpuIcon() {
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-sm border border-system bg-system/4 shadow-[inset_0_0_0.7rem_--alpha(var(--color-system)/6%)]"
      aria-hidden="true"
    >
      <Cpu
        className="h-[1.05rem] w-[1.05rem] text-system-hover"
        strokeWidth={1.7}
      />
    </span>
  );
}
