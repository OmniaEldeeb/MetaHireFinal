import { api } from "../client";

/** Messaging lands in Stage 8; the shell only needs the unread badge now. */
export const conversationsApi = {
  unreadCount: () =>
    api.get<{ unread_count: number }>("/conversations/unread-count"),
};
