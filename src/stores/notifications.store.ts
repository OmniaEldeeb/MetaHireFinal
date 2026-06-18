import { create } from "zustand";
import type { NotificationItem } from "@/lib/api/endpoints/notifications";

interface NotificationsState {
  unreadCount: number;
  items: NotificationItem[];
  loaded: boolean;
  setUnreadCount: (n: number) => void;
  setItems: (items: NotificationItem[]) => void;
  /** Handle a real-time NotificationSent payload. */
  onIncoming: (data: unknown) => void;
  markReadLocal: (id: number) => void;
  markAllLocal: () => void;
  removeLocal: (id: number) => void;
}

function asItem(data: unknown): NotificationItem | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.id !== "number" || typeof d.title !== "string") return null;
  return {
    id: d.id,
    type: String(d.type ?? "system"),
    title: d.title,
    message: String(d.message ?? ""),
    data: (d.data as Record<string, unknown>) ?? null,
    is_read: false,
    read_at: null,
    created_at: String(d.created_at ?? new Date().toISOString()),
  };
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  items: [],
  loaded: false,
  setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),
  setItems: (items) => set({ items, loaded: true }),
  onIncoming: (data) =>
    set((s) => {
      const item = asItem(data);
      return {
        unreadCount: s.unreadCount + 1,
        items: item ? [item, ...s.items].slice(0, 30) : s.items,
      };
    }),
  markReadLocal: (id) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id ? { ...i, is_read: true, read_at: new Date().toISOString() } : i,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllLocal: () =>
    set((s) => ({
      items: s.items.map((i) => ({ ...i, is_read: true })),
      unreadCount: 0,
    })),
  removeLocal: (id) =>
    set((s) => {
      const target = s.items.find((i) => i.id === id);
      return {
        items: s.items.filter((i) => i.id !== id),
        unreadCount:
          target && !target.is_read
            ? Math.max(0, s.unreadCount - 1)
            : s.unreadCount,
      };
    }),
}));
