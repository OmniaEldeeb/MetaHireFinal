"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Countdown({
  minutes,
  running,
}: {
  minutes: number;
  running: boolean;
}) {
  const total = minutes * 60;
  const [remaining, setRemaining] = useState(total);

  useEffect(() => {
    setRemaining(total);
  }, [total]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setRemaining((r) => Math.max(0, r - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [running]);

  const pct = Math.max(0, remaining / total);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-16 w-16">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--line))" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={pct > 0.33 ? "rgb(var(--accent))" : "rgb(var(--coral))"}
            strokeWidth="3"
            strokeDasharray={`${pct * 100} 100`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className={cn("readout text-xs font-bold", pct < 0.33 && "text-coral")}>
            {m}:{String(s).padStart(2, "0")}
          </span>
        </div>
      </div>
      <p className="text-[0.65rem] text-faint">remaining</p>
    </div>
  );
}
