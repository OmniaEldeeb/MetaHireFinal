"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AuthError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-display text-xl font-bold">Something went wrong</p>
      <div className="flex gap-3">
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link href="/" className="rounded-xl border border-line px-4 py-2.5 text-sm">Back home</Link>
      </div>
    </div>
  );
}
