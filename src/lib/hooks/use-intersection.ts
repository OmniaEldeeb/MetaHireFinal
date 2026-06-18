"use client";

import { useEffect, useRef } from "react";

export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  onVisible: () => void,
) {
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || fired.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !fired.current) {
          fired.current = true;
          onVisible();
          obs.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, onVisible]);
}
