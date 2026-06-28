"use client";

/**
 * Simplified post card for public profile pages.
 * Shows content, media, author + timestamp, and lightweight stats.
 * Clicking the card opens /posts/{id} to see the full post with actions.
 * The shares stat opens the "who shared" modal in place.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { imgUrl } from "@/lib/utils";
import { SmartImage, SmartVideo } from "@/components/social/smart-media";
import { Globe, Users, Lock, Briefcase, MapPin, ExternalLink } from "lucide-react";
import type { Post } from "@/lib/api/endpoints/social";
import { PostSharesModal } from "@/components/social/post-shares-modal";

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
  const router = useRouter();
  const [showShares, setShowShares] = useState(false);
  const VisIcon = VISIBILITY_ICONS[(post.visibility as keyof typeof VISIBILITY_ICONS) ?? "public"] ?? Globe;
  const authorName = post.author?.display_name ?? post.author?.name ?? "?";
  const authorImg = post.author?.display_image
    ?? (post.author as { candidate_profile?: { profile_image_url?: string } })?.candidate_profile?.profile_image_url
    ?? (post.author as { company?: { logo_url?: string } })?.company?.logo_url;

  return (
    <>
      <a
        href={`/posts/${post.id}`}
        className="block rounded-2xl border border-line bg-surface p-4 hover:border-brand transition-colors"
      >
        {/* Author row */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-xs font-bold text-brand">
            {authorImg
              ? <img src={imgUrl(authorImg) ?? ""} alt="" className="h-full w-full object-cover" />
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
            {(post.shares_count ?? 0) > 0 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShares(true); }}
                className="hover:text-ink hover:underline"
              >
                🔁 {post.shares_count}
              </button>
            )}
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
                <SmartVideo key={i} src={resolved} controls={false} className="rounded-xl w-full max-h-40 object-cover bg-black" />
              ) : (
                <SmartImage key={i} src={resolved} alt="" className="rounded-xl w-full max-h-40 object-cover" />
              );
            })}
          </div>
        )}

        {/* Shared job posting — type=job_share */}
        {post.shared_job && (
          <div
            role="link"
            tabIndex={0}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/jobs/${post.shared_job!.id}`); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); router.push(`/jobs/${post.shared_job!.id}`); } }}
            className="mt-3 block cursor-pointer overflow-hidden rounded-xl border border-line bg-elevated transition-colors hover:border-brand"
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4 pb-2 pt-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface">
                {post.shared_job.company?.logo_url || post.shared_job.company?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl(post.shared_job.company.logo_url ?? post.shared_job.company.logo) ?? ""} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Briefcase className="h-4 w-4 text-faint" />
                )}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs font-semibold">{post.shared_job.company?.name}</p>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint" />
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-bold text-ink">{post.shared_job.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {post.shared_job.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-faint" />{post.shared_job.location}</span>
                )}
                {post.shared_job.work_model && <span className="capitalize">{post.shared_job.work_model.replace(/_/g, " ")}</span>}
                {post.shared_job.work_type && <span className="capitalize">{post.shared_job.work_type.replace(/_/g, " ")}</span>}
                {post.shared_job.salary_range && <span className="font-medium text-brand">{post.shared_job.salary_range}</span>}
              </div>
              <p className="mt-2.5 text-xs font-medium text-brand">View job →</p>
            </div>
          </div>
        )}
      </a>

      {showShares && (
        <PostSharesModal
          postId={post.id}
          total={post.shares_count ?? 0}
          onClose={() => setShowShares(false)}
        />
      )}
    </>
  );
}