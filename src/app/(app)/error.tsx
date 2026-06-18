"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring in production
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-md rounded-3xl border border-coral/20 bg-surface p-10 text-center shadow-soft">
        <AlertTriangle className="mx-auto h-12 w-12 text-coral/70" />
        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted">
          {error?.message || "An unexpected error occurred. Our team has been notified."}
        </p>
        {error?.digest && (
          <p className="readout mt-2 text-xs text-faint">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-7 flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-strong"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium hover:border-brand"
          >
            <Home className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
