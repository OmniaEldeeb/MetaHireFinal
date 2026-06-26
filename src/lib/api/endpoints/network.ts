import { api } from "../client";

// Normalised user shape returned by NetworkController::formatUser()
// Used in connections, pending, sent, and suggestions
export interface NetworkUser {
  id: number;
  role?: string;
  name?: string;
  display_name?: string;
  display_image?: string | null;
  profile_image_url?: string | null;  // candidate avatar
  logo_url?: string | null;           // company logo
  headline?: string | null;
  slug?: string | null;
}

// GET /network → { id, type, status, requester, recipient }
export interface NetworkConnection {
  id: number;
  type?: "connection" | "follow";
  status?: "pending" | "accepted";
  created_at?: string;
  requester?: NetworkUser;
  recipient?: NetworkUser;
}

// GET /network/pending → { id, status, requester }
// GET /network/sent   → { id, status, recipient }
export interface NetworkRequest {
  id: number;
  status?: string;
  created_at?: string;
  requester?: NetworkUser;   // pending: who sent the request
  recipient?: NetworkUser;   // sent: who we sent to
}

// GET /network/suggestions → flat NetworkUser[] (no id/status wrapper)
export type NetworkSuggestion = NetworkUser;

function extractKey<T>(r: unknown, key: string): T[] {
  if (!r || typeof r !== "object") return [];
  const obj = r as Record<string, unknown>;
  if (key in obj) {
    const v = obj[key];
    if (Array.isArray(v)) return v as T[];
    if (v && typeof v === "object" && "data" in (v as object)) {
      return ((v as { data?: T[] }).data ?? []) as T[];
    }
  }
  if ("data" in obj && Array.isArray((obj as { data?: unknown[] }).data)) {
    return (obj as { data: T[] }).data;
  }
  return [];
}

export const networkApi = {
  connections: () =>
    api.get<unknown>("/network")
      .then((r) => extractKey<NetworkConnection>(r, "connections")),

  pending: () =>
    api.get<unknown>("/network/pending")
      .then((r) => extractKey<NetworkRequest>(r, "requests")),

  sent: () =>
    api.get<unknown>("/network/sent")
      .then((r) => extractKey<NetworkRequest>(r, "requests")),

  suggestions: () =>
    api.get<unknown>("/network/suggestions")
      .then((r) => extractKey<NetworkSuggestion>(r, "suggestions")),

  // GET /network/status/{user} → { status, connection_id }
  // status: none|pending_sent|pending_received|connected|following|followed_by|self
  status: (userId: number) =>
    api.get<{ status: string; connection_id: number | null }>(`/network/status/${userId}`),

  connect: (userId: number) =>
    api.post<{ type: string; status: string }>(`/network/connect/${userId}`),

  accept: (connectionId: number) =>
    api.post<unknown>(`/network/connections/${connectionId}/accept`),

  disconnect: (connectionId: number) =>
    api.delete<unknown>(`/network/connections/${connectionId}`),
};