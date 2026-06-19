"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/section";
import { socialApi } from "@/lib/api/endpoints/social";
import { PostCard } from "./post-card";
import type { Post } from "@/lib/api/endpoints/social";

export function SinglePostPage({ postId }: { postId: number }) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => socialApi.getPost(postId),
  });

  // getPost returns { post?: Post } | Post after API client unwraps envelope
  const post: Post | undefined = data
    ? ("post" in (data as { post?: Post }) ? (data as { post?: Post }).post : (data as Post))
    : undefined;

  return (
    <Container className="max-w-2xl py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : isError || !post ? (
        <p className="py-16 text-center text-sm text-muted">Post not found.</p>
      ) : (
        <PostCard post={post} />
      )}
    </Container>
  );
}