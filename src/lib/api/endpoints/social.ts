import { api } from "../client";
import type { Paginated } from "../types";
import type { ReactionType, PostVisibility } from "@/lib/constants/enums";

export interface PostAuthor {
  id: number;
  name: string;         // AuthorResource: name = display_name
  display_name?: string;
  role: string;
  display_image?: string | null;  // AuthorResource field name (not avatar_url)
  headline?: string;
  slug?: string | null;
  // showCandidate/showCompany posts return nested profile instead of display_image
  candidate_profile?: { profile_image_url?: string | null; headline?: string | null } | null;
  company?: { logo_url?: string | null; logo?: string | null } | null;
}

export interface Post {
  id: number;
  content?: string;
  content_format?: string;
  type?: string;
  visibility?: PostVisibility;
  media_urls?: string[];    // PostResource field name (not media)
  author?: PostAuthor;
  reactions_count?: number;
  comments_count?: number;
  shares_count?: number;
  views_count?: number;
  my_reaction?: ReactionType | null;
  is_saved?: boolean;       // PostResource field name (not saved)
  is_edited?: boolean;
  created_at?: string;
  updated_at?: string;
  shared_job_id?: number | null;
}

export interface Comment {
  id: number;
  content: string;
  parent_id?: number | null;
  author?: PostAuthor;
  created_at?: string;
  replies?: Comment[];
}

function paged<T>(r: unknown, key?: string): { items: T[]; page: number; lastPage: number; total: number } {
  if (Array.isArray(r)) return { items: r as T[], page: 1, lastPage: 1, total: (r as T[]).length };
  const obj = r as Record<string, unknown>;
  // Try the provided key first (e.g. 'posts', 'comments', 'saved_posts')
  if (key && key in obj) {
    const v = obj[key];
    if (Array.isArray(v)) return { items: v as T[], page: 1, lastPage: 1, total: (v as T[]).length };
    if (v && typeof v === "object") {
      const p = v as Paginated<T>;
      return { items: p.data ?? [], page: p.current_page ?? 1, lastPage: p.last_page ?? 1, total: p.total ?? p.data?.length ?? 0 };
    }
  }
  // Fallback: flat paginator { data: [], current_page, ... }
  const p = r as Paginated<T>;
  return { items: p.data ?? [], page: p.current_page ?? 1, lastPage: p.last_page ?? 1, total: p.total ?? p.data?.length ?? 0 };
}

export const socialApi = {
  feed: (page = 1) =>
    api.get<unknown>(`/posts?page=${page}`).then((r) => paged<Post>(r, "posts")),

  createPost: (data: FormData) =>
    api.post<Post>("/posts", data),

  getPost: (id: number) =>
    api.get<{ post?: Post } | Post>(`/posts/${id}`),

  updatePost: (id: number, body: { content?: string; visibility?: string }) =>
    api.put<Post>(`/posts/${id}`, body),

  deletePost: (id: number) =>
    api.delete<unknown>(`/posts/${id}`),

  recordViews: (post_ids: number[]) =>
    api.post<unknown>("/posts/views", { post_ids }),

  react: (postId: number, type: ReactionType) =>
    api.post<{ reacted: boolean }>(`/posts/${postId}/react`, { type }),

  unreact: (postId: number) =>
    api.delete<unknown>(`/posts/${postId}/react`),

  // POST /api/posts/{post}/share — three types confirmed from SocialController:
  // repost: creates a new quoting post — requires visibility, optional content
  // direct: sends as DM — requires target_users[], optional content/caption
  // link:   increments counter, returns { url } — no extra fields needed
  shareLink: (postId: number) =>
    api.post<{ url?: string }>(`/posts/${postId}/share`, { type: "link" }),

  shareRepost: (postId: number, visibility: "public" | "connections" | "private", content?: string) =>
    api.post<{ post?: unknown }>(`/posts/${postId}/share`, {
      type: "repost",
      visibility,
      content: content ?? "",
    }),

  shareDirect: (postId: number, targetUsers: number[], content?: string) =>
    api.post<{ sent_to?: number }>(`/posts/${postId}/share`, {
      type: "direct",
      target_users: targetUsers,
      content: content ?? "",
    }),

  savePost: (postId: number) =>
    api.post<{ saved: boolean }>(`/posts/${postId}/save`),

  savedPosts: () =>
    api.get<unknown>("/me/saved-posts").then((r) => paged<Post>(r, "saved_posts")),

  comments: (postId: number) =>
    api.get<unknown>(`/posts/${postId}/comments`).then((r) => paged<Comment>(r, "comments")),

  addComment: (postId: number, content: string, parent_id?: number) =>
    api.post<Comment>(`/posts/${postId}/comment`, {
      content,
      ...(parent_id !== undefined ? { parent_id } : {}),
    }),

  deleteComment: (commentId: number) =>
    api.delete<unknown>(`/comments/${commentId}`),
};