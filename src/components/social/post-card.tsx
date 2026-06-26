"use client";

import { imgUrl } from "@/lib/utils";
import Link from "next/link";
import { useState, useRef } from "react";
import { useIntersectionObserver } from "@/lib/hooks/use-intersection";
import {
  Image as ImageIcon, X, Globe, Users, Lock,
  MoreVertical, Trash2, Loader2, Pencil, Check, Bookmark,
  Briefcase, MapPin, ExternalLink,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { socialApi, type Post } from "@/lib/api/endpoints/social";
import { ReactionBar } from "./reaction-bar";
import { PostContent } from "./post-content";
import { CommentsSection } from "./comments-section";
import { useAuthStore } from "@/stores/auth.store";
import { useToastStore } from "@/stores/toast.store";

// ── Visibility icon ──────────────────────────────────────────────────────────
function VisIcon({ v }: { v?: string }) {
  if (v === "connections") return <Users className="h-3.5 w-3.5" />;
  if (v === "private") return <Lock className="h-3.5 w-3.5" />;
  return <Globe className="h-3.5 w-3.5" />;
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// ── Post card ────────────────────────────────────────────────────────────────
// Normalize author across both shapes:
// 1. AuthorResource: { id, role, name, display_name, display_image, headline }
// 2. showCandidate plain: { id, name, candidate_profile: { profile_image_url } }
function authorImage(author: Post["author"]): string | null {
  if (!author) return null;
  // AuthorResource shape: display_image
  if (author.display_image) return author.display_image;
  // showCandidate posts: candidate_profile.profile_image_url
  if (author.candidate_profile?.profile_image_url) return author.candidate_profile.profile_image_url;
  // showCompany posts: company.logo_url
  if (author.company?.logo_url) return author.company.logo_url;
  return null;
}
function authorName(author: Post["author"]): string {
  if (!author) return "?";
  return author.name ?? author.display_name ?? "?";
}

export function PostCard({ post, onView }: { post: Post; onView?: (id: number) => void }) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.push);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useIntersectionObserver(ref, () => onView?.(post.id));

  const del = async () => {
    setMenuOpen(false);
    try {
      await socialApi.deletePost(post.id);
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast({ kind: "success", title: "Post deleted" });
    } catch {
      toast({ kind: "error", title: "Delete failed" });
    }
  };

  // isOwn: check both user_id (direct) and author.id (from AuthorResource)
  const isOwn = post.user_id === user?.id || post.author?.id === user?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? "");
  const [editVisibility, setEditVisibility] = useState<"public" | "connections" | "private">(
    (post.visibility as "public" | "connections" | "private") ?? "public"
  );
  const [saving, setSaving] = useState(false);
  const [bookmarked, setBookmarked] = useState(post.is_saved ?? false);
  const [bookmarking, setBookmarking] = useState(false);

  const toggleSave = async () => {
    if (bookmarking) return;
    setBookmarking(true);
    setBookmarked((v) => !v); // optimistic
    try {
      const res = await socialApi.savePost(post.id);
      setBookmarked(res.saved);
      toast({ kind: "success", title: res.saved ? "Post saved" : "Post unsaved" });
    } catch {
      setBookmarked((v) => !v); // revert
      toast({ kind: "error", title: "Couldn't save post" });
    } finally {
      setBookmarking(false);
    }
  };

  const saveEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await socialApi.updatePost(post.id, { content: editContent.trim(), visibility: editVisibility });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["saved-posts"] });
      setIsEditing(false);
      toast({ kind: "success", title: "Post updated" });
    } catch {
      toast({ kind: "error", title: "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      ref={ref}
      className="rounded-2xl border border-line bg-surface p-5"
    >
      {/* Author */}
      <div className="flex items-start gap-3">
        {(() => {
          const authorHref = post.author
            ? post.author.role === "company"
              ? `/companies/${post.author.id}`
              : `/users/${post.author.id}`
            : null;
          const avatar = (
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated text-sm font-bold text-brand">
              {authorImage(post.author)
                ? <img src={imgUrl(authorImage(post.author)) ?? ""} alt="" className="h-full w-full object-cover" />
                : authorName(post.author).charAt(0)}
            </span>
          );
          return authorHref ? (
            <Link href={authorHref} className="shrink-0">{avatar}</Link>
          ) : avatar;
        })()}
        <div className="min-w-0 flex-1">
          {(() => {
            const authorHref = post.author
              ? post.author.role === "company"
                ? `/companies/${post.author.id}`
                : `/users/${post.author.id}`
              : null;
            return authorHref ? (
              <Link href={authorHref} className="text-sm font-semibold hover:underline">
                {authorName(post.author)}
              </Link>
            ) : (
              <p className="text-sm font-semibold">{authorName(post.author)}</p>
            );
          })()}
          <div className="flex items-center gap-1.5 text-xs text-faint">
            <VisIcon v={post.visibility} />
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
        {/* Three-dots menu — visible for all posts */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-elevated hover:text-ink"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-line2 bg-surface shadow-lift">
                {/* Save/Unsave — available for all posts */}
                <button
                  onClick={() => { setMenuOpen(false); toggleSave(); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-elevated"
                >
                  <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current text-brand" : ""}`} />
                  {bookmarked ? "Unsave" : "Save post"}
                </button>
                {/* Edit & Delete — only for own posts */}
                {isOwn && (
                  <>
                    <button onClick={() => { setMenuOpen(false); setIsEditing(true); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-elevated">
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button onClick={del} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-coral hover:bg-elevated">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content — edit mode or display mode */}
      {isEditing ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            autoFocus
            className="w-full resize-none rounded-xl border border-brand bg-elevated px-3 py-2.5 text-sm outline-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={editVisibility}
              onChange={(e) => setEditVisibility(e.target.value as "public" | "connections" | "private")}
              className="rounded-lg border border-line bg-elevated px-2 py-1.5 text-xs outline-none"
            >
              <option value="public">Public</option>
              <option value="connections">Connections</option>
              <option value="private">Private</option>
            </select>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setIsEditing(false)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-elevated">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving || !editContent.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : post.content ? (
        <div className="mt-4">
          <PostContent content={post.content} contentFormat={post.content_format} />
        </div>
      ) : null}

      {/* Shared job posting — type=job_share */}
      {post.shared_job && (
        <Link
          href={`/jobs/${post.shared_job.id}`}
          className="mt-3 block rounded-xl border border-line bg-elevated hover:border-brand transition-colors overflow-hidden"
        >
          {/* Company header */}
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-2 border-b border-line">
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface">
              {post.shared_job.company?.logo_url || post.shared_job.company?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl(post.shared_job.company.logo_url ?? post.shared_job.company.logo) ?? ""}
                  alt="" className="h-full w-full object-cover"
                />
              ) : (
                <Briefcase className="h-4 w-4 text-faint" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{post.shared_job.company?.name}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint" />
          </div>

          {/* Job details */}
          <div className="px-4 py-3">
            <p className="text-sm font-bold text-ink">{post.shared_job.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {post.shared_job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-faint" />{post.shared_job.location}
                </span>
              )}
              {post.shared_job.work_model && (
                <span className="capitalize">{post.shared_job.work_model.replace(/_/g, " ")}</span>
              )}
              {post.shared_job.work_type && (
                <span className="capitalize">{post.shared_job.work_type.replace(/_/g, " ")}</span>
              )}
              {post.shared_job.experience_level && (
                <span className="capitalize">{post.shared_job.experience_level}</span>
              )}
              {post.shared_job.salary_range && (
                <span className="font-medium text-brand">{post.shared_job.salary_range}</span>
              )}
            </div>
            {post.shared_job.skills && post.shared_job.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {post.shared_job.skills.slice(0, 5).map((s) => (
                  <span key={s} className="rounded-md bg-brand-soft px-2 py-0.5 text-[0.65rem] font-medium text-brand">
                    {s}
                  </span>
                ))}
                {post.shared_job.skills.length > 5 && (
                  <span className="text-[0.65rem] text-faint">+{post.shared_job.skills.length - 5} more</span>
                )}
              </div>
            )}
            <p className="mt-2.5 text-xs font-medium text-brand">View job →</p>
          </div>
        </Link>
      )}

      {/* Quoted / shared original post */}
      {post.shared_post && (
        <div className="mt-3 rounded-xl border border-line bg-elevated overflow-hidden">
          {/* Original author header */}
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-2 border-b border-line">
            <Link
              href={post.shared_post.author?.role === "company"
                ? `/companies/${post.shared_post.author?.id}`
                : `/users/${post.shared_post.author?.id}`}
              className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface text-xs font-bold text-brand"
            >
              {post.shared_post.author?.display_image || post.shared_post.author?.candidate_profile?.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl(post.shared_post.author.display_image ?? post.shared_post.author.candidate_profile?.profile_image_url) ?? ""}
                  alt="" className="h-full w-full object-cover"
                />
              ) : (
                authorName(post.shared_post.author).charAt(0)
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={post.shared_post.author?.role === "company"
                  ? `/companies/${post.shared_post.author?.id}`
                  : `/users/${post.shared_post.author?.id}`}
                className="text-sm font-semibold hover:underline"
              >
                {authorName(post.shared_post.author)}
              </Link>
              {post.shared_post.created_at && (
                <p className="text-xs text-faint">
                  {new Date(post.shared_post.created_at).toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </p>
              )}
            </div>
            <Link
              href={`/posts/${post.shared_post.id}`}
              className="shrink-0 text-xs text-brand hover:underline"
            >
              View →
            </Link>
          </div>
          {/* Original content */}
          <div className="px-4 py-3">
            {post.shared_post.content && (
              <div className="line-clamp-6 text-sm text-muted">
                <PostContent
                  content={post.shared_post.content}
                  contentFormat={post.shared_post.content_format}
                />
              </div>
            )}
            {/* Original media */}
            {post.shared_post.media_urls?.[0] && (() => {
              const url = post.shared_post.media_urls![0];
              const isVideo = /\.(mp4|webm)(\?|$)/i.test(url);
              return isVideo ? (
                <video src={imgUrl(url) ?? ""} controls className="mt-2 w-full rounded-lg max-h-48 bg-black" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl(url) ?? ""} alt="" className="mt-2 w-full rounded-lg object-cover max-h-48" />
              );
            })()}
          </div>
        </div>
      )}

      {/* Media */}
      {post.media_urls?.length ? (
        <div className={`mt-3 grid gap-2 ${post.media_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {post.media_urls.map((url, i) => {
            const resolved = imgUrl(url) ?? "";
            const isVideo = /\.(mp4|webm)(\?|$)/i.test(url);
            return isVideo ? (
              <video
                key={i}
                src={resolved}
                controls
                className="rounded-xl w-full max-h-80 bg-black"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={resolved} alt="" className="rounded-xl object-cover w-full max-h-80" />
            );
          })}
        </div>
      ) : null}

      {/* Reactions */}
      <div className="mt-4">
        <ReactionBar
          postId={post.id}
          myReaction={post.my_reaction}
          reactionCount={post.reactions_count}
          commentCount={post.comments_count}
          shareCount={post.shares_count}
          saved={bookmarked}
          onSave={toggleSave}
          onComment={() => setShowComments((v) => !v)}
        />
      </div>

      {showComments && (
        <div className="mt-3">
          <CommentsSection postId={post.id} />
        </div>
      )}
    </article>
  );
}

// ── Create post ──────────────────────────────────────────────────────────────
export function CreatePost({ onCreated }: { onCreated?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.push);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "connections" | "private">("public");
  const [media, setMedia] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const post = async () => {
    if (!content.trim()) return;  // content is required by backend
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      fd.append("visibility", visibility);
      fd.append("type", "general");
      media.forEach((f, idx) => fd.append(`media[${idx}]`, f));
      await socialApi.createPost(fd);
      setContent("");
      setMedia([]);
      onCreated?.();
    } catch (err: unknown) {
      const apiErr = err as { message?: string; fieldErrors?: Record<string, string[]> };
      const detail = apiErr?.fieldErrors
        ? Object.values(apiErr.fieldErrors).flat().join(" ")
        : apiErr?.message;
      toast({ kind: "error", title: "Couldn't post", message: detail });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
          {user?.name?.charAt(0) ?? "U"}
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={media.length > 0 ? "Add a caption… (required)" : "What's on your mind?"}
          rows={3}
          className="flex-1 resize-none rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>

      {media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((f, i) => {
            const isVideo = f.type.startsWith("video/");
            const objUrl = URL.createObjectURL(f);
            return (
              <div key={i} className="relative">
                {isVideo ? (
                  <video
                    src={objUrl}
                    className="h-20 w-20 rounded-xl object-cover"
                    muted
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={objUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
                )}
                <button
                  onClick={() => setMedia((m) => m.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-coral text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted hover:bg-elevated"
        >
          <ImageIcon className="h-4 w-4" /> Photo / Video
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
          multiple
          className="hidden"
          onChange={(e) => setMedia((m) => [...m, ...Array.from(e.target.files ?? [])])}
        />

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as typeof visibility)}
          className="ml-auto h-9 rounded-xl border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand"
        >
          <option value="public">Public</option>
          <option value="connections">Connections</option>
          <option value="private">Only me</option>
        </select>

        <button
          onClick={post}
          disabled={!content.trim() || busy}
          className="h-9 rounded-xl bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </button>
      </div>
    </div>
  );
}