"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Newspaper } from "lucide-react";
import { Container } from "@/components/ui/section";
import { PostCard, CreatePost } from "./post-card";
import { PostCardSkeleton } from "@/components/ui/skeleton";
import { socialApi } from "@/lib/api/endpoints/social";

const SCROLL_KEY = "feed-scroll-y";

export function SocialFeed() {
  const qc = useQueryClient();
  const [viewed, setViewed] = useState<Set<number>>(new Set());

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => socialApi.feed(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.lastPage ? last.page + 1 : undefined,
    staleTime: 60_000,
    gcTime: 5 * 60_000, // keep loaded pages so back-navigation restores them
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  // ── Auto-load the next page when the sentinel scrolls into view ───────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px" }, // start fetching before the user hits the bottom
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Scroll restoration ────────────────────────────────────────────────────
  // Save position continuously; restore on mount once cached pages are present
  // (e.g. returning from an individual post). rAF lets the restored content lay
  // out first.
  useEffect(() => {
    const onScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    if (!data?.pages.length) return; // nothing to restore onto yet
    const saved = Number(sessionStorage.getItem(SCROLL_KEY) ?? 0);
    restoredRef.current = true;
    if (saved > 0) {
      requestAnimationFrame(() => window.scrollTo(0, saved));
    }
  }, [data?.pages.length]);

  // ── View tracking (records every 5 distinct viewed posts) ─────────────────
  const submittedRef = useRef(new Set<number>());
  const handleView = useCallback((id: number) => {
    setViewed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      if (next.size % 5 === 0) {
        const newIds = [...next].filter((i) => !submittedRef.current.has(i));
        if (newIds.length > 0) {
          socialApi
            .recordViews(newIds)
            .then(() => newIds.forEach((i) => submittedRef.current.add(i)))
            .catch(() => {});
        }
      }
      return next;
    });
  }, []);

  const refresh = () => {
    sessionStorage.removeItem(SCROLL_KEY);
    restoredRef.current = true; // don't auto-restore after an intentional refresh
    window.scrollTo(0, 0);
    qc.resetQueries({ queryKey: ["feed"] });
  };

  return (
    <Container className="max-w-2xl py-8">
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Feed</h1>

      <CreatePost onCreated={refresh} />

      <div className="mt-5 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-sm text-muted">
            Couldn&apos;t load the feed. Please refresh.
          </p>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-2xl border border-line bg-surface py-16 text-center">
            <Newspaper className="h-8 w-8 text-faint" />
            <p className="text-sm text-muted">
              Nothing here yet — start by posting something.
            </p>
          </div>
        ) : (
          items.map((post) => (
            <PostCard key={post.id} post={post} onView={handleView} collapsible />
          ))
        )}
      </div>

      {/* Infinite-scroll sentinel + status */}
      {!isLoading && !isError && items.length > 0 && (
        <div ref={sentinelRef} className="mt-6 flex justify-center py-4">
          {isFetchingNextPage ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          ) : hasNextPage ? (
            <span className="text-xs text-faint">Loading more…</span>
          ) : (
            <span className="text-xs text-faint">You&apos;re all caught up.</span>
          )}
        </div>
      )}
    </Container>
  );
}