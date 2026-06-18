import { api } from "../client";
import type { Paginated } from "../types";

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  unread_count: number;
  notifications: Paginated<NotificationItem>;
}

export const notificationsApi = {
  list: (page = 1) =>
    api.get<NotificationsResponse>(`/notifications?page=${page}`),

  // Controller returns { count: N } not { unread_count: N }
  unreadCount: () =>
    api.get<{ count: number }>("/notifications/unread-count")
      .then((r) => ({ count: (r as { count?: number }).count ?? 0 })),

  markRead: (id: number) =>
    api.patch<unknown>(`/notifications/${id}/read`),
  markAllRead: () => api.post<unknown>("/notifications/read-all"),
  remove: (id: number) => api.delete<unknown>(`/notifications/${id}`),
};
