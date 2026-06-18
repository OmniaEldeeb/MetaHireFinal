"use client";

import { imgUrl } from "@/lib/utils";
import Link from "next/link";
import { useState, useRef } from "react";
import { useIntersectionObserver } from "@/lib/hooks/use-intersection";
import {
  Image as ImageIcon, X, Globe, Users, Lock,
  MoreVertical, Trash2, Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { socialApi, type Post } from "@/lib/api/endpoints/social";
import { ReactionBar } from "./reaction-bar";
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

  const isOwn = post.author?.id === user?.id;

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
        {isOwn && (
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
                <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-line2 bg-surface shadow-lift">
                  <button onClick={del} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-coral hover:bg-elevated">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed">
          {post.content}
        </p>
      )}

      {/* Media */}
      {post.media_urls?.length ? (
        <div className={`mt-3 grid gap-2 ${post.media_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {post.media_urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={imgUrl(url) ?? ""} alt="" className="rounded-xl object-cover w-full max-h-80" />
          ))}
        </div>
      ) : null}

      {/* Reactions */}
      <div className="mt-4">
        <ReactionBar
          postId={post.id}
          myReaction={post.my_reaction}
          reactionCount={post.reactions_count}
          commentCount={post.comments_count}
          saved={post.is_saved}
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
    if (!content.trim() && !media.length) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      fd.append("visibility", visibility);
      fd.append("type", "general");
      media.forEach((f) => fd.append("media[]", f));
      await socialApi.createPost(fd);
      setContent("");
      setMedia([]);
      onCreated?.();
    } catch {
      toast({ kind: "error", title: "Couldn't post" });
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
          placeholder="What's on your mind?"
          rows={3}
          className="flex-1 resize-none rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>

      {media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((f, i) => (
            <div key={i} className="relative">
              <img
                src={URL.createObjectURL(f)}
                alt=""
                className="h-20 w-20 rounded-xl object-cover"
              />
              <button
                onClick={() => setMedia((m) => m.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-coral text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted hover:bg-elevated"
        >
          <ImageIcon className="h-4 w-4" /> Photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
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
          disabled={(!content.trim() && !media.length) || busy}
          className="h-9 rounded-xl bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </button>
      </div>
    </div>
  );
}