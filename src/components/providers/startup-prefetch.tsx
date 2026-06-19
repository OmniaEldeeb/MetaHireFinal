"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "@/lib/api/endpoints/jobs";
import { api } from "@/lib/api/client";

/**
 * Pre-fetches data that multiple screens need, so the first render
 * of any screen that uses them is instant.
 */
export function StartupPrefetch() {
  const qc = useQueryClient();

  useEffect(() => {
    // Categories — used by jobs board filters and job creation form
    qc.prefetchQuery({
      queryKey: ["categories"],
      queryFn: jobsApi.categories,
      staleTime: 1000 * 60 * 30,
    });

    // Notification type metadata — labels, categories, channels per type
    // Route: GET /meta/notification-types (public, no auth required)
    qc.prefetchQuery({
      queryKey: ["meta-notification-types"],
      queryFn: () => api.get("/meta/notification-types"),
      staleTime: 1000 * 60 * 60,
    });
  }, [qc]);

  return null;
}