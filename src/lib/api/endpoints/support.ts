import { api } from "../client";
import type { Paginated } from "../types";

export type TicketType = "bug" | "complaint" | "question" | "feature_request";
export type TicketCategory = "account" | "payment" | "interview" | "job" | "other";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface TicketReply {
  id: number;
  body: string;
  is_staff: boolean;           // true = support staff, false = user — from controller
  user?: { id: number; name: string; role?: string }; // loaded via replies.user:id,name,role
  created_at?: string;
}

export interface Ticket {
  id: number;
  type?: TicketType;
  subject?: string;
  body?: string;
  category?: TicketCategory;
  status?: TicketStatus;
  created_at?: string;
  updated_at?: string;
  replies?: TicketReply[];
  replies_count?: number;      // included by withCount('replies') on list endpoint
}

// GET /support/tickets returns { tickets: { data: [...], current_page, ... } }
// After API client unwraps result/data envelope we get { tickets: Paginated<Ticket> }
function extractTickets(r: unknown): Ticket[] {
  if (!r || typeof r !== "object") return [];
  if (Array.isArray(r)) return r as Ticket[];

  const obj = r as Record<string, unknown>;

  // { tickets: { data: [...] } }  ← list endpoint
  if ("tickets" in obj) {
    const t = obj.tickets;
    if (!t) return [];
    if (Array.isArray(t)) return t as Ticket[];
    return ((t as Record<string, unknown>).data as Ticket[]) ?? [];
  }

  // { data: [...] }  ← plain paginator
  if ("data" in obj && Array.isArray(obj.data)) return obj.data as Ticket[];

  return [];
}

// GET /support/tickets/{id} returns { ticket: {...} }
function extractTicket(r: unknown): Ticket | null {
  if (!r || typeof r !== "object") return null;
  const obj = r as Record<string, unknown>;
  if ("ticket" in obj) return (obj.ticket as Ticket) ?? null;
  return r as Ticket;
}

export const supportApi = {
  list: (params?: { status?: string; per_page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.per_page) sp.set("per_page", String(params.per_page));
    const q = sp.toString();
    return api.get<unknown>(`/support/tickets${q ? `?${q}` : ""}`)
      .then(extractTickets);
  },

  create: (body: { type: TicketType; subject: string; body: string; category: TicketCategory }) =>
    api.post<unknown>("/support/tickets", body),

  get: (id: number) =>
    api.get<unknown>(`/support/tickets/${id}`).then(extractTicket),

  reply: (id: number, body: string) =>
    api.post<unknown>(`/support/tickets/${id}/reply`, { body }),

  close: (id: number) =>
    api.patch<unknown>(`/support/tickets/${id}/close`),
};
