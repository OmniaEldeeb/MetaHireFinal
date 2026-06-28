"use client";

/**
 * GlobalProgressBar
 * =================
 * A thin, app-wide loading bar pinned to the very top edge. It appears the
 * moment any API request is in flight and disappears once everything resolves
 * (success OR failure), driven by the network store.
 *
 * Deliberately non-blocking: 3px tall, pointer-events:none, aria-hidden — it
 * never overlays content, never traps focus, and never stops the user from
 * seeing or interacting with the page.
 */

import { useEffect, useState } from "react";
import { useNetworkStore } from "@/stores/network.store";

export function GlobalProgressBar() {
  const pending = useNetworkStore((s) => s.pending);
  const active = pending > 0;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      return;
    }
    // Requests finished — let the bar fade out, then unmount.
    const t = setTimeout(() => setShow(false), 400);
    return () => clearTimeout(t);
  }, [active]);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden"
    >
      <div
        className={`h-full w-2/5 rounded-r-full bg-brand shadow-[0_0_8px_rgba(0,0,0,0.15)] transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ animation: "mh-progress-slide 1.15s ease-in-out infinite" }}
      />
      <style>{`
        @keyframes mh-progress-slide {
          0%   { transform: translateX(-110%); }
          60%  { transform: translateX(180%); }
          100% { transform: translateX(280%); }
        }
      `}</style>
    </div>
  );
}