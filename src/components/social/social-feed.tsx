"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import { Container } from "@/components/ui/section";
import { PostCard, CreatePost } from "./post-card";
import { PostCardSkeleton } from "@/components/ui/skeleton";
import { socialApi } from "@/lib/api/endpoints/social";

export function SocialFeed() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [viewed, setViewed] = useState<Set<number>>(new Set());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["feed", page],
    queryFn: () => socialApi.feed(page),
  });

  const { items = [], lastPage = 1 } = data ?? {};

  const handleView = useCallback(
    (id: number) => {
      setViewed((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev).add(id);
        if (next.size % 5 === 0) {
          socialApi.recordViews([...next]).catch(() => {});
        }
        return next;
      });
    },
    [],
  );

  const refresh = () => {
    setPage(1);
    qc.invalidateQueries({ queryKey: ["feed"] });
  };

  return (
    <Container className="max-w-2xl py-8">
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight">
        Feed
      </h1>

      <CreatePost onCreated={refresh} />

      <div className="mt-5 space-y-4">
        {isLoading ? (
          <div className="space-y-4">{Array.from({length:3}).map((_,i)=><PostCardSkeleton key={i}/>)}</div>
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
            <PostCard key={post.id} post={post} onView={handleView} />
          ))
        )}
      </div>

      {lastPage > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-line2 bg-surface px-4 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="readout text-sm text-muted">
            {page} / {lastPage}
          </span>
          <button
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-line2 bg-surface px-4 text-sm disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </Container>
  );
}
