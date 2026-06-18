"use client";

import { useEffect } from "react";
import { installRateLimitHandler } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function RateLimitHandler() {
  const push = useToastStore((s) => s.push);
  useEffect(() => {
    installRateLimitHandler(push);
  }, [push]);
  return null;
}
