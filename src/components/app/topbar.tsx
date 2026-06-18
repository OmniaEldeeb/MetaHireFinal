"use client";

import Link from "next/link";
import { Menu, MessageSquare, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { useMessagesStore } from "@/stores/messages.store";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const msgUnread = useMessagesStore((s) => s.unreadCount);

  return (
    <header className="sticky top-0 z-[150] flex h-16 items-center gap-2 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="grid h-10 w-10 place-items-center rounded-xl border border-line2 bg-surface text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link
        href="/search"
        className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted hover:border-brand hover:text-brand sm:flex"
      >
        <Search className="h-4 w-4" />
        <span>Search…</span>
      </Link>
      <div className="flex-1" />

      <Link
        href="/messages"
        aria-label="Messages"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-line2 bg-surface text-muted transition-colors hover:border-brand hover:text-brand"
      >
        <MessageSquare className="h-[18px] w-[18px]" />
        {msgUnread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[0.65rem] font-semibold text-white">
            {msgUnread > 99 ? "99+" : msgUnread}
          </span>
        ) : null}
      </Link>

      <NotificationBell />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
