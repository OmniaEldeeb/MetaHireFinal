"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthBootstrap } from "@/components/providers/auth-bootstrap";
import { RateLimitHandler } from "@/components/providers/rate-limit-handler";
import { StartupPrefetch } from "@/components/providers/startup-prefetch";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthBootstrap />
        <RateLimitHandler />
        <StartupPrefetch />
        {children}
      </QueryProvider>
    </ThemeProvider>
  );
}
