"use client";

/**
 * PostSharesModal — "who shared this post"
 * ========================================
 * Reusable across every surface that renders a post (feed, single post,
 * profiles, saved). Shows the share breakdown plus the people behind each kind:
 *   - Reposts (quoting posts) — with the repost caption
 *   - Sent directly (via DM) — capped at 50 by the API
 *   - Link copies — anonymous, shown only as a count
 *
 * Data: GET /posts/{post}/shares/users → { breakdown, reposts(paginated), direct_shares }.
 */

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2, Repeat2, Send } from "lucide-react";
import { cn, imgUrl } from "@/lib/utils";
import { socialApi } from "@/lib/api/endpoints/social";

type ShareUserRow = {
  id: number;
  role: string;
  display_name: string;
  display_image?: string | null;
  headline?: string | null;
};

function ShareUserItem({ user, children }: { user: ShareUserRow; children?: React.ReactNode }) {
  const href = user.role === "company" ? `/companies/${user.id}` : `/users/${user.id}`;
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <a href={href} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-elevated">
          {user.display_image
            ? <img src={imgUrl(user.display_image) ?? ""} alt="" className="h-full w-full object-cover" />
            : <span className="text-sm font-bold text-brand">{user.display_name?.charAt(0)}</span>}
        </a>
        <div className="min-w-0 flex-1">
          <a href={href} className="block truncate text-sm font-medium hover:underline">{user.display_name}</a>
          {user.headline && <p className="truncate text-xs text-muted">{user.headline}</p>}
        </div>
      </div>
      {children}
    </li>
  );
}

export function PostSharesModal({ postId, total, onClose }: { postId: number; total: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["share-users", postId],
    queryFn: () => socialApi.shareUsers(postId),
    staleTime: 30_000,
  });

  const breakdown = data?.breakdown ?? { total, reposts: 0, direct: 0, link: 0 };
  const repostsRaw = data?.reposts as unknown;
  const reposts = (Array.isArray(repostsRaw)
    ? repostsRaw
    : ((repostsRaw as { data?: unknown })?.data ?? [])) as {
      user: ShareUserRow; comment?: string | null; reposted_at: string; post_id: number;
    }[];
  const directShares = (data?.direct_shares ?? []) as { user: ShareUserRow; shared_at: string }[];

  const [tab, setTab] = useState<"reposts" | "direct">("reposts");
  useEffect(() => {
    if (!isLoading) setTab(reposts.length === 0 && directShares.length > 0 ? "direct" : "reposts");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const tabBtn = (key: "reposts" | "direct", label: string, count: number, Icon: typeof Repeat2) => (
    <button
      onClick={() => setTab(key)}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors",
        tab === key ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label} {count > 0 && <span className="readout">({count})</span>}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="modal-in mb-4 w-full max-w-sm overflow-hidden rounded-3xl border border-line2 bg-surface shadow-lift sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-display text-sm font-bold tracking-tight">
            {breakdown.total} Share{breakdown.total !== 1 ? "s" : ""}
          </h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line">
          {tabBtn("reposts", "Reposts", breakdown.reposts, Repeat2)}
          {tabBtn("direct", "Sent directly", breakdown.direct, Send)}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
          ) : tab === "reposts" ? (
            reposts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No reposts yet</p>
            ) : (
              <ul className="divide-y divide-line">
                {reposts.map((r, i) => (
                  <ShareUserItem key={i} user={r.user}>
                    {r.comment && (
                      <p className="mt-1.5 pl-12 text-xs text-muted line-clamp-2">{r.comment}</p>
                    )}
                  </ShareUserItem>
                ))}
              </ul>
            )
          ) : directShares.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Not sent in messages yet</p>
          ) : (
            <ul className="divide-y divide-line">
              {directShares.map((d, i) => (
                <ShareUserItem key={i} user={d.user} />
              ))}
            </ul>
          )}
        </div>

        {/* Link-copy count — anonymous, no user list */}
        {breakdown.link > 0 && (
          <div className="border-t border-line px-5 py-2.5 text-center text-xs text-faint">
            + {breakdown.link} anonymous link {breakdown.link === 1 ? "copy" : "copies"}
          </div>
        )}
      </div>
    </div>
  );
}