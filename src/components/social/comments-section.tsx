"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Trash2, CornerDownRight } from "lucide-react";
import { socialApi, type Comment } from "@/lib/api/endpoints/social";
import { useAuthStore } from "@/stores/auth.store";
import { useToastStore } from "@/stores/toast.store";

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "Just now" : d === 1 ? "Yesterday" : `${d}d`;
}

function CommentItem({
  c,
  postId,
  userId,
  depth = 0,
  onReply,
}: {
  c: Comment;
  postId: number;
  userId?: number;
  depth?: number;
  onReply: (id: number, name: string) => void;
}) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const del = async () => {
    try {
      await socialApi.deleteComment(c.id);
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    } catch {
      toast({ kind: "error", title: "Delete failed" });
    }
  };

  return (
    <div className={depth > 0 ? "ml-8" : ""}>
      <div className="flex gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
          {c.author?.name?.charAt(0) ?? "?"}
        </span>
        <div className="group min-w-0 flex-1 rounded-xl bg-elevated px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">{c.author?.name}</span>
            <div className="flex items-center gap-1">
              <span className="text-[0.65rem] text-faint">{timeAgo(c.created_at)}</span>
              {c.author?.id === userId && (
                <button onClick={del} className="opacity-0 text-faint hover:text-coral group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          {/* CommentResource returns "content" (not "body") per API schema */}
          <p className="mt-0.5 text-sm text-muted">{c.content}</p>
          {depth === 0 && (
            <button
              onClick={() => onReply(c.id, c.author?.name ?? "")}
              className="mt-1 flex items-center gap-1 text-[0.65rem] text-faint hover:text-brand"
            >
              <CornerDownRight className="h-3 w-3" /> Reply
            </button>
          )}
        </div>
      </div>
      {/* Nested replies — CommentResource includes replies[] array */}
      {c.replies?.length ? (
        <div className="mt-2 space-y-2">
          {c.replies.map((r) => (
            <CommentItem
              key={r.id}
              c={r}
              postId={postId}
              userId={userId}
              depth={1}
              onReply={onReply}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommentsSection({ postId }: { postId: number }) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.push);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => socialApi.comments(postId),
  });
  const comments = data?.items ?? [];

  const submit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      // API requires { content } (not body). Pass parent_id for replies.
      await socialApi.addComment(postId, content.trim(), replyTo?.id);
      setContent("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      toast({ kind: "error", title: "Comment failed" });
    } finally {
      setSending(false);
    }
  };

  const handleReply = (id: number, name: string) => {
    setReplyTo({ id, name });
    setContent(`@${name} `);
  };

  return (
    <div className="border-t border-line pt-4">
      {isLoading ? (
        <div className="grid place-items-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              c={c}
              postId={postId}
              userId={user?.id}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      {replyTo && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-brand/5 px-3 py-1.5 text-xs text-brand">
          <CornerDownRight className="h-3 w-3" />
          Replying to {replyTo.name}
          <button onClick={() => { setReplyTo(null); setContent(""); }} className="ml-auto text-faint hover:text-ink">✕</button>
        </div>
      )}

      <div className="mt-3 flex gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
          {user?.name?.charAt(0) ?? "U"}
        </span>
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), submit())}
            placeholder={replyTo ? `Reply to ${replyTo.name}…` : "Write a comment…"}
            className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted/70"
          />
          <button
            onClick={submit}
            disabled={!content.trim() || sending}
            className="text-brand disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
