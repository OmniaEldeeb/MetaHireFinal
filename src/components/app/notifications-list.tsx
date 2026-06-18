"use client";

import { useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Circle,
} from "lucide-react";
import { NotificationSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNotificationsStore } from "@/stores/notifications.store";
import { notificationsApi } from "@/lib/api/endpoints/notifications";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function NotificationsList({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const items = useNotificationsStore((s) => s.items);
  const loaded = useNotificationsStore((s) => s.loaded);
  const unread = useNotificationsStore((s) => s.unreadCount);
  const setItems = useNotificationsStore((s) => s.setItems);
  const markReadLocal = useNotificationsStore((s) => s.markReadLocal);
  const markAllLocal = useNotificationsStore((s) => s.markAllLocal);
  const removeLocal = useNotificationsStore((s) => s.removeLocal);

  useEffect(() => {
    let active = true;
    notificationsApi
      .list()
      .then((res) => {
        if (active) setItems(res.notifications.data);
      })
      .catch(() => {
        /* show empty state */
      });
    return () => {
      active = false;
    };
  }, [setItems]);

  const shown = compact ? items.slice(0, 6) : items;

  const markRead = (id: number) => {
    markReadLocal(id);
    notificationsApi.markRead(id).catch(() => {});
  };
  const markAll = () => {
    markAllLocal();
    notificationsApi.markAllRead().catch(() => {});
  };
  const remove = (id: number) => {
    removeLocal(id);
    notificationsApi.remove(id).catch(() => {});
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold">Notifications</p>
        {unread > 0 ? (
          <button
            onClick={markAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        ) : null}
      </div>

      {!loaded ? (
        <div className="divide-y divide-line">{Array.from({length:4}).map((_,i)=><NotificationSkeleton key={i}/>)}</div>
      ) : shown.length === 0 ? (
        <div className="grid place-items-center gap-2 px-4 py-12 text-center">
          <Bell className="h-7 w-7 text-faint" />
          <p className="text-sm text-muted">You&apos;re all caught up.</p>
        </div>
      ) : (
        <ul className={cn("divide-y divide-line", compact && "max-h-96 overflow-auto")}>
          {shown.map((n) => {
            // Determine href from notification data for navigation
            const d = n.data ?? {};
            let href: string | undefined;
            if (d.application_id) href = "/applications";
            else if (d.job_id) href = `/jobs/${d.job_id}`;
            else if (d.conversation_id) href = "/messages";
            else if (d.connection_id) href = "/network";

            return (
              <li
                key={n.id}
                className={cn(
                  "group flex gap-3 px-4 py-3",
                  !n.is_read && "bg-brand/[0.04]",
                )}
              >
                <button
                  onClick={() => !n.is_read && markRead(n.id)}
                  aria-label={n.is_read ? "Read" : "Mark read"}
                  className="mt-1.5 shrink-0"
                >
                  <Circle
                    className={cn(
                      "h-2 w-2",
                      n.is_read
                        ? "text-transparent"
                        : "fill-brand text-brand",
                    )}
                  />
                </button>
                <div
                  className={cn("min-w-0 flex-1", href && "cursor-pointer")}
                  onClick={() => {
                    if (!n.is_read) markRead(n.id);
                    if (href) {
                      onNavigate?.();
                      window.location.href = href;
                    }
                  }}
                >
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  {n.message ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {n.message}
                    </p>
                  ) : null}
                  <p className="readout mt-1 text-[0.7rem] text-faint">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => remove(n.id)}
                  aria-label="Delete"
                  className="self-start text-faint opacity-0 transition-opacity hover:text-coral group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
