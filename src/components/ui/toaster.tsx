"use client";

import Link from "next/link";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";
import { useToastStore, type ToastKind } from "@/stores/toast.store";

const ICON: Record<ToastKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

const TONE: Record<ToastKind, string> = {
  info: "text-brand",
  success: "text-green",
  error: "text-coral",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-5 right-5 z-[1000] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2.5">
      {toasts.map((t) => {
        const Icon = ICON[t.kind];
        const body = (
          <div className="modal-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-line2 bg-surface p-4 shadow-lift">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${TONE[t.kind]}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{t.title}</p>
              {t.message ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                  {t.message}
                </p>
              ) : null}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dismiss(t.id);
              }}
              aria-label="Dismiss"
              className="text-faint hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
        return t.href ? (
          <Link key={t.id} href={t.href} onClick={() => dismiss(t.id)}>
            {body}
          </Link>
        ) : (
          <div key={t.id}>{body}</div>
        );
      })}
    </div>
  );
}
