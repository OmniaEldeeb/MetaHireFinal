import { SinglePostPage } from "@/components/social/single-post-page";

export default function PostPage({ params }: { params: { id: string } }) {
  return <SinglePostPage postId={Number(params.id)} />;
}