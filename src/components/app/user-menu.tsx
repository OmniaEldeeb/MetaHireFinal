"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/lib/hooks/use-auth";

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-line2 bg-surface py-1.5 pl-1.5 pr-2.5 text-sm transition-colors hover:border-brand"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft font-display text-sm font-bold text-brand">
          {user?.name?.charAt(0) ?? "U"}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:block">
          {user?.name}
        </span>
        <ChevronDown className="h-4 w-4 text-faint" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-line2 bg-surface shadow-lift">
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-faint">{user?.email}</p>
              <span className="mt-2 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-brand">
                {role}
              </span>
            </div>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-elevated"
            >
              <Settings className="h-4 w-4 text-faint" />
              Account settings
            </Link>
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-coral hover:bg-elevated"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
