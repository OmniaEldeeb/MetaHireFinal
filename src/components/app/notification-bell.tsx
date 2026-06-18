"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotificationsStore } from "@/stores/notifications.store";
import { NotificationsList } from "./notifications-list";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const count = useNotificationsStore((s) => s.unreadCount);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-line2 bg-surface text-muted transition-colors hover:border-brand hover:text-brand"
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[0.65rem] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line2 bg-surface shadow-lift">
            <NotificationsList compact onNavigate={() => setOpen(false)} />
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-line py-3 text-center text-sm font-medium text-brand hover:bg-elevated"
            >
              View all
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
