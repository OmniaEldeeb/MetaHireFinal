"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Bookmark } from "lucide-react";
import { Container } from "@/components/ui/section";
import { socialApi } from "@/lib/api/endpoints/social";
import { PostCard } from "./post-card";

export function SavedPostsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: socialApi.savedPosts,
  });

  // Filter nulls — backend returns null for deleted posts in saved list
  const posts = (data?.items ?? []).filter(Boolean);

  return (
    <Container className="max-w-2xl py-8">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Saved posts</h1>
      <p className="mt-1 text-sm text-muted">Posts you&apos;ve bookmarked.</p>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : posts.length === 0 ? (
          <div className="grid place-items-center gap-3 py-20 text-center">
            <Bookmark className="h-8 w-8 text-faint" />
            <p className="text-sm text-muted">
              No saved posts yet — bookmark posts from your feed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}