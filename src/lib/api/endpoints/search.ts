import { api } from "../client";

export interface SearchResultJob {
  id: number; title: string; location?: string;
  company?: { id: number; name: string; logo_url?: string | null };
  work_type?: string; experience_level?: string; created_at?: string;
}
export interface SearchResultUser {
  id: number; name: string; role?: string;
  candidate_profile?: { headline?: string; profile_image_url?: string | null };
}
export interface SearchResultCompany {
  id: number; name: string; industry?: string; logo_url?: string | null;
}
export interface SearchResultPost {
  id: number; content?: string;
  author?: { id: number; name: string };
  created_at?: string;
}
export interface SearchResults {
  jobs?: SearchResultJob[];
  users?: SearchResultUser[];
  companies?: SearchResultCompany[];
  posts?: SearchResultPost[];
}
export interface Suggestion {
  type: string; label: string; id?: number;
}

function qs(p: Record<string, string | number | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p))
    if (v !== undefined && v !== "") s.set(k, String(v));
  return s.toString() ? `?${s}` : "";
}

// SearchController returns each result type as a Laravel paginator { data: [], current_page, ... }
// Extract the items array from each paginator
function extractItems<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as T[];
  const obj = v as { data?: T[] };
  if (Array.isArray(obj.data)) return obj.data;
  return [];
}

export const searchApi = {
  search: (params: {
    q: string; type?: string; posted_within?: string;
    location?: string; level?: string; work_model?: string;
    work_type?: string; per_page?: number;
  }) =>
    api.get<unknown>(`/search${qs(params as Record<string, string | number | undefined>)}`)
      .then((r) => {
        const obj = (r ?? {}) as Record<string, unknown>;
        return {
          query:     obj.query as string | undefined,
          totals:    obj.totals as Record<string, number> | undefined,
          jobs:      extractItems<SearchResultJob>(obj.jobs),
          users:     extractItems<SearchResultUser>(obj.users),
          companies: extractItems<SearchResultCompany>(obj.companies),
          posts:     extractItems<SearchResultPost>(obj.posts),
        } as SearchResults;
      }),

  suggestions: (q: string) =>
    api.get<{ jobs?: Suggestion[]; users?: Suggestion[]; companies?: Suggestion[] } | Suggestion[]>(
      `/search/suggestions?q=${encodeURIComponent(q)}`,
    ),
};
