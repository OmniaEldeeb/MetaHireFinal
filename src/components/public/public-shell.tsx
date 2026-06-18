"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/auth.store";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const authed = useAuthStore((s) => s.status === "authenticated");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-shell items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-6">
            <Logo />
            <Link
              href="/jobs"
              className="hidden text-sm font-medium text-muted hover:text-ink sm:block"
            >
              Browse jobs
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {authed ? (
              <Button href="/dashboard" size="sm">
                Dashboard
              </Button>
            ) : (
              <>
                <Button href="/login" variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button href="/register" size="sm">
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-shell flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-faint sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} MetaHire</p>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-muted">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-muted">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-muted">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
