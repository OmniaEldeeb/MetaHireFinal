import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SignalReadout } from "@/components/landing/signal-readout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface/40 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 grid-field" aria-hidden />
        <div
          className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-brand/15 blur-[110px]"
          aria-hidden
        />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-sm">
          <SignalReadout />
          <p className="mt-8 font-display text-2xl font-semibold leading-snug tracking-tight">
            Hiring that reads the signal, not just the résumé.
          </p>
          <p className="mt-3 text-sm text-muted">
            Answers, voice, and expression — scored in real time.
          </p>
        </div>
        <p className="readout relative text-xs text-muted">
          © {new Date().getFullYear()} MetaHire
        </p>
      </aside>

      {/* Form panel */}
      <main id="main-content" className="flex flex-col">
        <div className="flex items-center justify-end p-5 sm:p-8">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-sm">
            <Suspense fallback={<div className="h-96" />}>{children}</Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}