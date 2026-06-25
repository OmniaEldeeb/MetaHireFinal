"use client";

/**
 * Simplified post card for public profile pages.
 * Shows content, media, author + timestamp — no social actions.
 * Clicking the card opens /posts/{id} to see the full post with actions.
 */
import { imgUrl } from "@/lib/utils";
import { Globe, Users, Lock } from "lucide-react";
import type { Post } from "@/lib/api/endpoints/social";

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const VISIBILITY_ICONS = { public: Globe, connections: Users, private: Lock };

export function ProfilePostCard({ post }: { post: Post }) {
  const VisIcon = VISIBILITY_ICONS[(post.visibility as keyof typeof VISIBILITY_ICONS) ?? "public"] ?? Globe;
  const authorName = post.author?.display_name ?? post.author?.name ?? "?";
  const authorImg = post.author?.display_image
    ?? (post.author as { candidate_profile?: { profile_image_url?: string } })?.candidate_profile?.profile_image_url
    ?? (post.author as { company?: { logo_url?: string } })?.company?.logo_url;

  return (
    <a
      href={`/posts/${post.id}`}
      className="block rounded-2xl border border-line bg-surface p-4 hover:border-brand transition-colors"
    >
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-xs font-bold text-brand">
          {authorImg
            ? <img loading="lazy" src={imgUrl(authorImg) ?? ""} alt="" className="h-full w-full object-cover" />
            : authorName.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{authorName}</p>
          <div className="flex items-center gap-1 text-xs text-faint">
            <VisIcon className="h-3 w-3" />
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted shrink-0">
          {(post.reactions_count ?? 0) > 0 && <span>👍 {post.reactions_count}</span>}
          {(post.comments_count ?? 0) > 0 && <span>💬 {post.comments_count}</span>}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-sm text-muted leading-relaxed line-clamp-3 whitespace-pre-line">
          {post.content}
        </p>
      )}

      {/* Media grid (max 2) */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`mt-3 grid gap-2 ${post.media_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {post.media_urls.slice(0, 2).map((url, i) => {
            const resolved = imgUrl(url) ?? "";
            const isVideo = /\.(mp4|webm)(\?|$)/i.test(url);
            return isVideo ? (
              <video key={i} src={resolved} className="rounded-xl w-full max-h-40 object-cover bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" key={i} src={resolved} alt="" className="rounded-xl w-full max-h-40 object-cover" />
            );
          })}
        </div>
      )}
    </a>
  );
}