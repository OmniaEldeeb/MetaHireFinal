"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const GRACE_SECONDS = 30; // extra time after expected_time before auto-submit

export function Countdown({
  minutes,
  running,
  onExpire,
}: {
  minutes: number;
  running: boolean;
  onExpire?: () => void;
}) {
  const total = minutes * 60;
  // remaining goes from total → 0 → -(GRACE_SECONDS) then fires onExpire
  const [remaining, setRemaining] = useState(total);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(total);
  }, [total]);

  useEffect(() => {
    if (!running) return;
    // Start the clock fresh every time recording begins — this covers a NEW
    // question that happens to share the previous question's expected_time
    // (so `total` didn't change), and re-recording the same question after a
    // failed/aborted submit. Without this, `remaining` carries over (possibly
    // already in the negative grace zone) and onExpire fires instantly,
    // skipping the question.
    setRemaining(total);
    const id = setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        // Fire auto-submit after grace period
        if (next <= -GRACE_SECONDS) {
          clearInterval(id);
          setTimeout(() => onExpireRef.current?.(), 50);
          return -GRACE_SECONDS;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, total]);

  const inGrace = remaining < 0;
  const graceRemaining = inGrace ? GRACE_SECONDS + remaining : 0; // counts 30→0

  // pct for the ring: normal phase uses remaining/total, grace shows shrinking grace bar
  const pct = inGrace
    ? graceRemaining / GRACE_SECONDS
    : Math.max(0, remaining / total);
  const displayRemaining = inGrace ? graceRemaining : remaining;
  const m = Math.floor(displayRemaining / 60);
  const s = displayRemaining % 60;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-16 w-16">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--line))" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={inGrace ? "rgb(var(--coral))" : pct > 0.33 ? "rgb(var(--accent))" : "rgb(var(--amber))"}
            strokeWidth="3"
            strokeDasharray={`${pct * 100} 100`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className={cn("readout text-xs font-bold", (pct < 0.33 || inGrace) && "text-coral")}>
            {m}:{String(s).padStart(2, "0")}
          </span>
        </div>
      </div>
      {inGrace ? (
        <p className="text-[0.65rem] text-coral font-medium animate-pulse">
          finishing soon…
        </p>
      ) : (
        <p className="text-[0.65rem] text-faint">remaining</p>
      )}
    </div>
  );
}