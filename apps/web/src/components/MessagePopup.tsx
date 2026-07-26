import { useState } from "react";
import { Button } from "./Button";

type MessagePopupProps = Readonly<{
  onBack: () => void;
}>;

export function MessagePopup({ onBack }: MessagePopupProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <>
      <div className="pt-[clamp(1.75rem,6vw,2.5rem)] pb-6">
        <p className="m-0 text-[clamp(1.05rem,2.5vw,1.2rem)] leading-[1.65] font-[600] text-content">
          User is tired of wasting time. User wants to build daily consistency
          and direct available time toward achieving the desired goal. Primary
          objective identified: convert intention into repeatable action.
        </p>
      </div>

      <p className="mt-0 mb-3 text-center text-[0.9rem] leading-[1.65] text-content-muted">
        Do you wish to continue?
      </p>

      <Button disabled={acknowledged} onClick={() => setAcknowledged(true)}>
        YES
      </Button>

      <button
        className="mt-4 w-full cursor-pointer border-0 bg-transparent font-mono text-[0.58rem] tracking-[0.09em] text-system uppercase hover:text-system-hover"
        type="button"
        onClick={onBack}
      >
        Return
      </button>

      <p className="mt-4 mb-0 text-center font-mono text-[0.56rem] tracking-[0.1em] text-content-subtle uppercase">
        Stop guessing. Start progressing.
      </p>
    </>
  );
}
