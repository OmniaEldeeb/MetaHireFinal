"use client";

import { useEffect } from "react";
import Link from "next/link";
import { create } from "zustand";
import { X, User, Building2, ArrowRight } from "lucide-react";

export const useSignupModal = create<{
  open: boolean;
  show: () => void;
  hide: () => void;
}>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));

const OPTIONS = [
  {
    href: "/register",
    icon: User,
    tone: "bg-brand-soft text-brand",
    title: "I'm a candidate",
    desc: "Build a CV, get matched, and interview with AI.",
  },
  {
    href: "/register/company",
    icon: Building2,
    tone: "bg-green/15 text-green",
    title: "I'm hiring",
    desc: "Post roles and let AI screen and rank applicants.",
  },
];

export function SignupModal() {
  const open = useSignupModal((s) => s.open);
  const hide = useSignupModal((s) => s.hide);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, hide]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={hide}
      role="dialog"
      aria-modal="true"
      aria-label="Choose account type"
    >
      <div
        className="modal-in relative w-full max-w-md rounded-3xl border border-line2 bg-bg-2 p-8 text-center shadow-lift sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={hide}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          Get started free
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Tell us who you are and we&apos;ll set up the right experience.
        </p>

        <div className="mt-8 flex flex-col gap-3 text-left">
          {OPTIONS.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              onClick={hide}
              className="group flex items-center gap-4 rounded-2xl border border-line2 bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand"
            >
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${o.tone}`}
              >
                <o.icon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{o.title}</span>
                <span className="block text-xs text-faint">{o.desc}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
            </Link>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            onClick={hide}
            className="font-medium text-brand hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
