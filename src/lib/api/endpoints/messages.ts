import { api } from "../client";
import type { Paginated } from "../types";

export interface OtherUser {
  id: number;
  role?: string;
  display_name?: string;
  display_image?: string | null;
  headline?: string;
}

export interface LatestMessage {
  body?: string | null;
  media_type?: string | null;
  sender_id?: number;
  created_at?: string;
}

export interface Conversation {
  id: number;
  last_message_at?: string | null;
  unread_count?: number;
  other_user?: OtherUser;
  latest_message?: LatestMessage | null;
}

export interface Message {
  id: number;
  body?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  sender_id?: number;
  created_at?: string;
}

function paged<T>(r: Paginated<T> | T[] | { conversations?: Paginated<T> } | { messages?: Paginated<T> }): { items: T[]; page: number; lastPage: number } {
  if (Array.isArray(r)) return { items: r, page: 1, lastPage: 1 };
  // GET /conversations → { conversations: Paginated<T> }
  if ("conversations" in r && (r as { conversations?: Paginated<T> }).conversations) {
    const c = (r as { conversations: Paginated<T> }).conversations;
    return { items: c.data ?? [], page: c.current_page ?? 1, lastPage: c.last_page ?? 1 };
  }
  // GET /conversations/{id}/messages → { messages: Paginated<T> }
  if ("messages" in r && (r as { messages?: Paginated<T> }).messages) {
    const m = (r as { messages: Paginated<T> }).messages;
    return { items: m.data ?? [], page: m.current_page ?? 1, lastPage: m.last_page ?? 1 };
  }
  const p = r as Paginated<T>;
  return { items: p.data ?? [], page: p.current_page ?? 1, lastPage: p.last_page ?? 1 };
}

export const messagesApi = {
  conversations: (page = 1) =>
    api.get<{ conversations?: Paginated<Conversation> } | Paginated<Conversation>>(
      `/conversations?page=${page}`,
    ).then((r) => paged<Conversation>(r as unknown as Paginated<Conversation>)),

  unreadCount: () =>
    api.get<{ data?: { unread_count: number } } | { unread_count: number }>(
      "/conversations/unread-count",
    ).then((r) => {
      if ("data" in (r as object) && typeof (r as { data?: unknown }).data === "object") {
        return ((r as { data: { unread_count: number } }).data).unread_count;
      }
      return (r as { unread_count: number }).unread_count ?? 0;
    }),

  openConversation: (userId: number) =>
    api.post<{ conversation_id?: number; data?: { conversation_id?: number } }>(
      "/conversations",
      { user_id: userId },
    ).then((r) => {
      const raw = r as { conversation_id?: number; data?: { conversation_id?: number } };
      return raw.conversation_id ?? raw.data?.conversation_id ?? 0;
    }),

  // Returns raw { conversation_id, other_user } for use in new conversation UI
  startConversation: (userId: number) =>
    api.post<unknown>("/conversations", { user_id: userId }),

  messages: (conversationId: number, page = 1) =>
    api.get<Paginated<Message> | Message[]>(
      `/conversations/${conversationId}/messages?page=${page}`,
    ).then((r) => paged<Message>(r as unknown as Paginated<Message>)),

  send: (conversationId: number, body: string | null, mediaFile?: File) => {
    const fd = new FormData();
    if (body) fd.append("body", body);
    if (mediaFile) fd.append("media", mediaFile);
    return api.post<Message>(`/conversations/${conversationId}/messages`, fd);
  },

  deleteMessage: (messageId: number) =>
    api.delete<unknown>(`/messages/${messageId}`),

  searchUsers: (q: string) =>
    api.get<{ users?: OtherUser[] } | OtherUser[]>(
      `/conversations/search-users?q=${encodeURIComponent(q)}`,
    ).then((r) =>
      Array.isArray(r) ? r : ((r as { users?: OtherUser[] }).users ?? []),
    ),
};
